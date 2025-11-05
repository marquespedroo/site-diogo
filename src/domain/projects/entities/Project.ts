import { Money } from '../../calculator/value-objects/Money';
import { ProjectLocation } from '../value-objects/ProjectLocation';
import { Unit } from './Unit';
import { BusinessRuleError } from '../../../lib/errors/BusinessRuleError';
import { NotFoundError } from '../../../lib/errors/NotFoundError';

/**
 * Project Statistics Interface
 */
export interface ProjectStatistics {
  totalUnits: number;
  availableUnits: number;
  soldUnits: number;
  reservedUnits: number;
  totalValue: Money;
  averagePricePerSqM: Money;
  minPrice: Money;
  maxPrice: Money;
}

/**
 * Project Params Interface
 */
export interface ProjectParams {
  id?: string;
  userId: string;
  name: string;
  location: ProjectLocation;
  description: string;
  units?: Unit[];
  sharedWith?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Project Entity (Aggregate Root)
 *
 * Aggregate root representing a real estate project with multiple units.
 * Manages unit collection and enforces business rules.
 * Follows Aggregate Root pattern from DDD.
 *
 * Business Rules:
 * - Only owner can edit project
 * - No duplicate tower/number combinations
 * - Shared users have read-only access
 * - Cannot share with yourself
 *
 * @example
 * const project = new Project({
 *   userId: 'user-123',
 *   name: 'Torre Azul',
 *   location: new ProjectLocation('São Paulo', 'Vila Mariana', 'SP'),
 *   description: 'Luxury apartments',
 * });
 *
 * project.addUnit(unit);
 * project.shareWith('user-456');
 * console.log(project.getStatistics());
 */
export class Project {
  private readonly id: string;
  private readonly userId: string;
  private name: string;
  private location: ProjectLocation;
  private description: string;
  private readonly units: Map<string, Unit>;
  private readonly sharedWith: Set<string>;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(params: ProjectParams) {
    // Generate ID if not provided
    this.id = params.id || this.generateId();
    this.userId = params.userId;
    this.name = params.name;
    this.location = params.location;
    this.description = params.description;
    this.units = new Map(params.units?.map((u) => [u.getId(), u]) || []);
    this.sharedWith = new Set(params.sharedWith || []);
    this.createdAt = params.createdAt || new Date();
    this.updatedAt = params.updatedAt || new Date();

    // Validate
    this.validate();
  }

  /**
   * Validate business rules
   */
  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Project name is required');
    }
    if (this.name.length > 200) {
      throw new Error('Project name cannot exceed 200 characters');
    }
  }

  // ============================================================================
  // Unit Management
  // ============================================================================

  /**
   * Add a unit to the project
   *
   * @param unit - Unit to add
   * @throws {BusinessRuleError} if unit already exists or has duplicate identifier
   */
  addUnit(unit: Unit): void {
    // Check if unit already exists by ID
    if (this.units.has(unit.getId())) {
      throw new BusinessRuleError('Unit already exists in this project');
    }

    // Check for duplicate tower/number combination
    const duplicate = Array.from(this.units.values()).find(
      (u) =>
        u.getIdentifier().getTower() === unit.getIdentifier().getTower() &&
        u.getIdentifier().getNumber() === unit.getIdentifier().getNumber()
    );

    if (duplicate) {
      throw new BusinessRuleError(
        `Unit with tower '${unit.getIdentifier().getTower()}' and number '${unit.getIdentifier().getNumber()}' already exists in this project`,
        'DUPLICATE_UNIT_IDENTIFIER'
      );
    }

    this.units.set(unit.getId(), unit);
    this.updatedAt = new Date();
  }

  /**
   * Add multiple units at once
   *
   * @param units - Array of units to add
   * @returns Object with success count and errors
   */
  addUnits(
    units: Unit[]
  ): { added: number; errors: Array<{ unit: Unit; error: string }> } {
    const errors: Array<{ unit: Unit; error: string }> = [];
    let added = 0;

    units.forEach((unit) => {
      try {
        this.addUnit(unit);
        added++;
      } catch (error) {
        errors.push({
          unit,
          error: (error as Error).message,
        });
      }
    });

    return { added, errors };
  }

  /**
   * Remove a unit from the project
   *
   * @param unitId - ID of unit to remove
   * @throws {NotFoundError} if unit doesn't exist
   */
  removeUnit(unitId: string): void {
    if (!this.units.has(unitId)) {
      throw new NotFoundError('Unit', unitId);
    }

    this.units.delete(unitId);
    this.updatedAt = new Date();
  }

  /**
   * Get a unit by ID
   *
   * @param unitId - Unit ID
   * @returns Unit or null if not found
   */
  getUnit(unitId: string): Unit | null {
    return this.units.get(unitId) || null;
  }

  /**
   * Update project details (name, location, description)
   *
   * @param updates - Fields to update
   */
  update(updates: {
    name?: string;
    location?: ProjectLocation;
    description?: string;
  }): void {
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Project name cannot be empty');
      }
      if (updates.name.length > 200) {
        throw new Error('Project name cannot exceed 200 characters');
      }
      this.name = updates.name;
    }

    if (updates.location !== undefined) {
      this.location = updates.location;
    }

    if (updates.description !== undefined) {
      this.description = updates.description;
    }

    this.updatedAt = new Date();
  }

  // ============================================================================
  // Sharing & Permissions
  // ============================================================================

  /**
   * Share project with another user
   *
   * @param userId - User ID to share with
   * @throws {BusinessRuleError} if trying to share with owner
   */
  shareWith(userId: string): void {
    if (userId === this.userId) {
      throw new BusinessRuleError(
        'Cannot share project with yourself',
        'SHARE_WITH_OWNER'
      );
    }

    this.sharedWith.add(userId);
    this.updatedAt = new Date();
  }

  /**
   * Remove user access to project
   *
   * @param userId - User ID to unshare with
   */
  unshareWith(userId: string): void {
    this.sharedWith.delete(userId);
    this.updatedAt = new Date();
  }

  /**
   * Check if user has access to project (owner or shared)
   *
   * @param userId - User ID to check
   * @returns true if user has access
   */
  hasAccess(userId: string): boolean {
    return userId === this.userId || this.sharedWith.has(userId);
  }

  /**
   * Check if user can edit project (only owner)
   *
   * @param userId - User ID to check
   * @returns true if user can edit
   */
  canEdit(userId: string): boolean {
    return userId === this.userId;
  }

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Get all available units
   */
  getAvailableUnits(): Unit[] {
    return Array.from(this.units.values()).filter(
      (u) => u.getStatus() === 'available'
    );
  }

  /**
   * Get units by tower
   *
   * @param tower - Tower identifier
   */
  getUnitsByTower(tower: string): Unit[] {
    return Array.from(this.units.values()).filter(
      (u) => u.getIdentifier().getTower() === tower.toUpperCase()
    );
  }

  /**
   * Get units by status
   *
   * @param status - Unit status to filter by
   */
  getUnitsByStatus(status: string): Unit[] {
    return Array.from(this.units.values()).filter(
      (u) => u.getStatus() === status
    );
  }

  /**
   * Get total value of all units
   */
  getTotalValue(): Money {
    const units = Array.from(this.units.values());
    if (units.length === 0) {
      return Money.zero();
    }

    return units.reduce(
      (sum, unit) => sum.add(unit.getPrice()),
      Money.zero()
    );
  }

  /**
   * Get average price per square meter across all units
   */
  getAveragePricePerSqM(): Money {
    const units = Array.from(this.units.values());
    if (units.length === 0) {
      return Money.zero();
    }

    const totalPricePerSqM = units.reduce(
      (sum, unit) => sum + unit.getPricePerSqM().getAmount(),
      0
    );

    return new Money(totalPricePerSqM / units.length);
  }

  /**
   * Get project statistics
   */
  getStatistics(): ProjectStatistics {
    const units = Array.from(this.units.values());

    if (units.length === 0) {
      return {
        totalUnits: 0,
        availableUnits: 0,
        soldUnits: 0,
        reservedUnits: 0,
        totalValue: Money.zero(),
        averagePricePerSqM: Money.zero(),
        minPrice: Money.zero(),
        maxPrice: Money.zero(),
      };
    }

    const prices = units.map((u) => u.getPrice().getAmount());

    return {
      totalUnits: units.length,
      availableUnits: units.filter((u) => u.getStatus() === 'available')
        .length,
      soldUnits: units.filter((u) => u.getStatus() === 'sold').length,
      reservedUnits: units.filter((u) => u.getStatus() === 'reserved').length,
      totalValue: this.getTotalValue(),
      averagePricePerSqM: this.getAveragePricePerSqM(),
      minPrice: new Money(Math.min(...prices)),
      maxPrice: new Money(Math.max(...prices)),
    };
  }

  /**
   * Get list of all unique towers in project
   */
  getTowers(): string[] {
    const towers = new Set<string>();
    this.units.forEach((unit) => {
      towers.add(unit.getIdentifier().getTower());
    });
    return Array.from(towers).sort();
  }

  // ============================================================================
  // Getters
  // ============================================================================

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getName(): string {
    return this.name;
  }

  getLocation(): ProjectLocation {
    return this.location;
  }

  getDescription(): string {
    return this.description;
  }

  getUnits(): ReadonlyArray<Unit> {
    return Array.from(this.units.values());
  }

  getSharedWith(): ReadonlySet<string> {
    return new Set(this.sharedWith);
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Convert to JSON for persistence/API
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      location: this.location.toJSON(),
      description: this.description,
      units: Array.from(this.units.values()).map((u) => u.toJSON()),
      sharedWith: Array.from(this.sharedWith),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Create Project from JSON
   */
  static fromJSON(json: Record<string, any>): Project {
    const units = json.units?.map((u: any) => Unit.fromJSON(u)) || [];

    return new Project({
      id: json.id,
      userId: json.userId,
      name: json.name,
      location: ProjectLocation.fromJSON(json.location),
      description: json.description,
      units,
      sharedWith: json.sharedWith || [],
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
    });
  }

  /**
   * Generate unique ID (timestamp-based)
   */
  private generateId(): string {
    return (
      Date.now().toString(36) + Math.random().toString(36).substring(2, 15)
    );
  }
}
