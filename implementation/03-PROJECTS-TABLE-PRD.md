# Projects Table - Product Requirements Document

## Document Control
- **Feature**: Multi-Agent Real Estate Projects Database
- **Version**: 1.0.0
- **Priority**: P1 (High)
- **Target Release**: Sprint 3
- **Owner**: Product Team

---

## 1. Feature Overview

### 1.1 Business Context
Real estate agencies manage multiple projects with hundreds of units. Agents need:
- Centralized database of all available units across projects
- Real-time updates when units are sold/reserved
- Multi-agent collaboration (shared access)
- Advanced filtering and sorting
- Export capabilities for client presentations

**Key Problem**: Agents use spreadsheets that get out of sync, causing duplicate sales and missed opportunities.

### 1.2 Success Metrics
```
Metric                    | Target
------------------------- | ----------
Projects created          | 500+
Units managed             | 50,000+
Daily active users        | 1,000+
Avg. response time        | < 200ms
Real-time sync success    | 99.9%
Export usage              | 40%+
```

---

## 2. Domain Model

```typescript
/**
 * Value Objects
 */
class ProjectLocation {
  constructor(
    private readonly city: string,
    private readonly neighborhood: string,
    private readonly state: string
  ) {}

  toString(): string {
    return `${this.neighborhood}, ${this.city}-${this.state}`;
  }
}

class UnitIdentifier {
  constructor(
    private readonly tower: string,
    private readonly number: string
  ) {}

  getTower(): string {
    return this.tower;
  }

  getNumber(): string {
    return this.number;
  }

  toString(): string {
    return `${this.tower}-${this.number}`;
  }
}

/**
 * Entities
 */
class Unit {
  constructor(
    private readonly id: string,
    private readonly identifier: UnitIdentifier,
    private readonly area: PropertyArea,
    private readonly price: Money,
    private readonly parkingSpots: string,
    private readonly origin: 'real' | 'permutante',
    private status: UnitStatus = 'available',
    private readonly metadata: Map<string, any> = new Map()
  ) {}

  // Status Management
  markAsSold(soldDate: Date, soldPrice?: Money): void {
    this.status = 'sold';
    this.metadata.set('soldDate', soldDate);
    if (soldPrice) {
      this.metadata.set('soldPrice', soldPrice);
    }
  }

  markAsReserved(reservedBy: string, reservedUntil: Date): void {
    this.status = 'reserved';
    this.metadata.set('reservedBy', reservedBy);
    this.metadata.set('reservedUntil', reservedUntil);
  }

  markAsAvailable(): void {
    this.status = 'available';
    this.metadata.delete('soldDate');
    this.metadata.delete('soldPrice');
    this.metadata.delete('reservedBy');
    this.metadata.delete('reservedUntil');
  }

  // Calculations
  getPricePerSqM(): Money {
    return new Money(this.price.getAmount() / this.area.getSquareMeters());
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getIdentifier(): UnitIdentifier {
    return this.identifier;
  }

  getStatus(): UnitStatus {
    return this.status;
  }

  // ... other getters
}

type UnitStatus = 'available' | 'reserved' | 'sold' | 'unavailable';

/**
 * Aggregate Root
 */
class Project {
  private readonly id: string;
  private readonly userId: string; // Owner
  private readonly name: string;
  private readonly location: ProjectLocation;
  private readonly description: string;
  private readonly units: Map<string, Unit>; // unitId → Unit
  private readonly sharedWith: Set<string>; // User IDs with access
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(params: ProjectParams) {
    this.id = params.id || generateUUID();
    this.userId = params.userId;
    this.name = params.name;
    this.location = params.location;
    this.description = params.description;
    this.units = new Map(params.units?.map(u => [u.getId(), u]) || []);
    this.sharedWith = new Set(params.sharedWith || []);
    this.createdAt = params.createdAt || new Date();
    this.updatedAt = params.updatedAt || new Date();
  }

  // Unit Management
  addUnit(unit: Unit): void {
    if (this.units.has(unit.getId())) {
      throw new BusinessRuleError('Unit already exists');
    }

    // Check for duplicate tower/number
    const duplicate = Array.from(this.units.values()).find(
      u =>
        u.getIdentifier().getTower() === unit.getIdentifier().getTower() &&
        u.getIdentifier().getNumber() === unit.getIdentifier().getNumber()
    );

    if (duplicate) {
      throw new BusinessRuleError(
        'Unit with same tower/number already exists'
      );
    }

    this.units.set(unit.getId(), unit);
    this.updatedAt = new Date();
  }

  updateUnit(unitId: string, updates: Partial<Unit>): void {
    const unit = this.units.get(unitId);
    if (!unit) {
      throw new NotFoundError('Unit not found');
    }

    // Apply updates (create new immutable unit)
    const updated = new Unit(/* ... */);
    this.units.set(unitId, updated);
    this.updatedAt = new Date();
  }

  removeUnit(unitId: string): void {
    if (!this.units.has(unitId)) {
      throw new NotFoundError('Unit not found');
    }

    this.units.delete(unitId);
    this.updatedAt = new Date();
  }

  // Sharing & Permissions
  shareWith(userId: string): void {
    if (userId === this.userId) {
      throw new BusinessRuleError('Cannot share with yourself');
    }

    this.sharedWith.add(userId);
    this.updatedAt = new Date();
  }

  unshareWith(userId: string): void {
    this.sharedWith.delete(userId);
    this.updatedAt = new Date();
  }

  hasAccess(userId: string): boolean {
    return userId === this.userId || this.sharedWith.has(userId);
  }

  canEdit(userId: string): boolean {
    return userId === this.userId; // Only owner can edit
  }

  // Queries
  getAvailableUnits(): Unit[] {
    return Array.from(this.units.values()).filter(
      u => u.getStatus() === 'available'
    );
  }

  getUnitsByTower(tower: string): Unit[] {
    return Array.from(this.units.values()).filter(
      u => u.getIdentifier().getTower() === tower
    );
  }

  getTotalValue(): Money {
    return Array.from(this.units.values()).reduce(
      (sum, unit) => sum.add(unit.getPrice()),
      new Money(0)
    );
  }

  getAveragePricePerSqM(): Money {
    const units = Array.from(this.units.values());
    if (units.length === 0) return new Money(0);

    const totalPricePerSqM = units.reduce(
      (sum, unit) => sum + unit.getPricePerSqM().getAmount(),
      0
    );

    return new Money(totalPricePerSqM / units.length);
  }

  getStatistics(): ProjectStatistics {
    const units = Array.from(this.units.values());

    return {
      totalUnits: units.length,
      availableUnits: units.filter(u => u.getStatus() === 'available').length,
      soldUnits: units.filter(u => u.getStatus() === 'sold').length,
      reservedUnits: units.filter(u => u.getStatus() === 'reserved').length,
      totalValue: this.getTotalValue(),
      averagePricePerSqM: this.getAveragePricePerSqM(),
      minPrice: new Money(
        Math.min(...units.map(u => u.getPrice().getAmount()))
      ),
      maxPrice: new Money(
        Math.max(...units.map(u => u.getPrice().getAmount()))
      )
    };
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getName(): string {
    return this.name;
  }

  getUnits(): ReadonlyArray<Unit> {
    return Array.from(this.units.values());
  }

  getSharedWith(): ReadonlySet<string> {
    return new Set(this.sharedWith);
  }

  // Serialization
  toJSON(): ProjectJSON {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      location: this.location.toString(),
      description: this.description,
      units: Array.from(this.units.values()).map(u => u.toJSON()),
      sharedWith: Array.from(this.sharedWith),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}
```

### 2.2 Repository Pattern with Real-time Sync

```typescript
/**
 * Repository with Supabase Realtime
 */
class SupabaseProjectRepository implements IProjectRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(project: Project): Promise<Project> {
    const json = project.toJSON();

    // Transaction: Insert project + units
    const { data: projectData, error: projectError } = await this.supabase
      .from('projects')
      .insert({
        id: json.id,
        user_id: json.userId,
        name: json.name,
        location: json.location,
        description: json.description,
        shared_with: json.sharedWith,
        created_at: json.createdAt,
        updated_at: json.updatedAt
      })
      .select()
      .single();

    if (projectError) {
      throw new DatabaseError('Failed to save project', projectError);
    }

    // Insert units
    if (json.units.length > 0) {
      const { error: unitsError } = await this.supabase.from('units').insert(
        json.units.map(u => ({
          id: u.id,
          project_id: json.id,
          tower: u.tower,
          unit_number: u.number,
          area: u.area,
          price: u.price,
          parking_spots: u.parkingSpots,
          origin: u.origin,
          status: u.status,
          metadata: u.metadata
        }))
      );

      if (unitsError) {
        // Rollback project
        await this.supabase.from('projects').delete().eq('id', json.id);
        throw new DatabaseError('Failed to save units', unitsError);
      }
    }

    return Project.fromJSON(json);
  }

  async findById(id: string): Promise<Project | null> {
    const { data: projectData, error: projectError } = await this.supabase
      .from('projects')
      .select('*, units(*)')
      .eq('id', id)
      .single();

    if (projectError) {
      if (projectError.code === 'PGRST116') return null;
      throw new DatabaseError('Failed to find project', projectError);
    }

    return this.mapToProject(projectData);
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToProject(
    projectId: string,
    callback: (event: RealtimeEvent) => void
  ): RealtimeChannel {
    const channel = this.supabase
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'units',
          filter: `project_id=eq.${projectId}`
        },
        payload => {
          callback({
            type: payload.eventType,
            data: payload.new || payload.old
          });
        }
      )
      .subscribe();

    return channel;
  }

  // ... other methods
}
```

### 2.3 Use Cases

```typescript
/**
 * Use Case: Create Project
 */
class CreateProjectUseCase {
  constructor(
    private readonly repository: IProjectRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(input: CreateProjectInput): Promise<CreateProjectOutput> {
    const validated = CreateProjectSchema.parse(input);

    const project = new Project({
      userId: validated.userId,
      name: validated.name,
      location: new ProjectLocation(
        validated.city,
        validated.neighborhood,
        validated.state
      ),
      description: validated.description,
      units: []
    });

    const saved = await this.repository.save(project);

    await this.eventPublisher.publish(new ProjectCreatedEvent(saved));

    return {
      id: saved.getId(),
      name: saved.getName()
    };
  }
}

/**
 * Use Case: Import Units from CSV
 */
class ImportUnitsFromCSVUseCase {
  constructor(
    private readonly repository: IProjectRepository,
    private readonly csvParser: ICSVParser
  ) {}

  async execute(input: ImportUnitsInput): Promise<ImportUnitsOutput> {
    // 1. Find project
    const project = await this.repository.findById(input.projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // 2. Verify ownership
    if (!project.canEdit(input.userId)) {
      throw new UnauthorizedError('Only owner can import units');
    }

    // 3. Parse CSV
    const rows = await this.csvParser.parse(input.csvBuffer);

    // 4. Create units
    const units: Unit[] = [];
    const errors: string[] = [];

    rows.forEach((row, index) => {
      try {
        const unit = new Unit(
          generateUUID(),
          new UnitIdentifier(row.tower, row.unitNumber),
          new PropertyArea(parseFloat(row.area)),
          new Money(parseFloat(row.price)),
          row.parkingSpots,
          row.origin as 'real' | 'permutante'
        );

        units.push(unit);
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    });

    // 5. Add units to project
    units.forEach(unit => {
      try {
        project.addUnit(unit);
      } catch (error) {
        errors.push(`Unit ${unit.getIdentifier().toString()}: ${error.message}`);
      }
    });

    // 6. Persist
    await this.repository.update(project);

    return {
      imported: units.length,
      errors
    };
  }
}

/**
 * Use Case: Real-time Sync Handler
 */
class HandleRealtimeUpdateUseCase {
  async execute(event: RealtimeEvent): Promise<void> {
    // Handle real-time updates from Supabase
    // Update local state, trigger UI updates, etc.
  }
}
```

---

## 3. Real-time Architecture

```typescript
/**
 * Client-side real-time subscription
 */
class ProjectRealtimeSync {
  private channel?: RealtimeChannel;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly projectId: string,
    private readonly onUpdate: (event: RealtimeEvent) => void
  ) {}

  start(): void {
    this.channel = this.supabase
      .channel(`project:${this.projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'units',
          filter: `project_id=eq.${this.projectId}`
        },
        payload => {
          this.handleUpdate(payload);
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log('Real-time sync started');
        }
      });
  }

  stop(): void {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = undefined;
    }
  }

  private handleUpdate(payload: any): void {
    const event: RealtimeEvent = {
      type: payload.eventType, // INSERT, UPDATE, DELETE
      data: payload.new || payload.old
    };

    this.onUpdate(event);
  }
}

// Usage in UI
const sync = new ProjectRealtimeSync(supabase, projectId, event => {
  // Update UI optimistically
  if (event.type === 'UPDATE') {
    updateUnitInUI(event.data);
  } else if (event.type === 'DELETE') {
    removeUnitFromUI(event.data.id);
  }
});

sync.start();
```

---

## 4. Export Functionality

```typescript
/**
 * CSV Export Service
 */
class CSVExportService {
  export(units: Unit[]): string {
    const headers = [
      'Empreendimento',
      'Torre',
      'Unidade',
      'Vagas',
      'Origem',
      'Área (m²)',
      'Valor Total',
      'Valor/m²'
    ];

    const rows = units.map(unit => [
      // Project name
      unit.getIdentifier().getTower(),
      unit.getIdentifier().getNumber(),
      unit.getParkingSpots(),
      unit.getOrigin(),
      unit.getArea().getSquareMeters(),
      unit.getPrice().getAmount(),
      unit.getPricePerSqM().getAmount()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

/**
 * API Endpoint: Export to CSV
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await authenticate(req);
    const { projectId } = req.query;

    const project = await projectRepository.findById(projectId as string);

    if (!project || !project.hasAccess(user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const csv = new CSVExportService().export(project.getUnits());

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="project-${projectId}.csv"`
    );

    return res.status(200).send(csv);
  } catch (error) {
    return handleError(error, res);
  }
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-04 | Product Team | Initial PRD |
