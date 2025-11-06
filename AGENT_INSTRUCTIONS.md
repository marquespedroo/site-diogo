# Parallel Agent Work Instructions

**CRITICAL**: All agents work simultaneously on the CURRENT codebase. Each agent has independent work that doesn't depend on other agents' output.

---

## Foundation Files Created (Reference These)

### API Clients (Contracts):
1. `/home/user/site-diogo/src/scripts/calculator-api.ts` ✅ EXISTS
2. `/home/user/site-diogo/src/scripts/market-study-api.ts` ✅ NEWLY CREATED
3. `/home/user/site-diogo/src/scripts/projects-api.ts` ✅ NEWLY CREATED

### Existing Backend Files (DO NOT MODIFY):
- Domain entities: `/home/user/site-diogo/src/domain/projects/entities/Project.ts`
- Domain entities: `/home/user/site-diogo/src/domain/projects/entities/Unit.ts`
- Repositories: `/home/user/site-diogo/src/infrastructure/database/SupabaseProjectRepository.ts`
- Repositories: `/home/user/site-diogo/src/infrastructure/database/SupabaseUnitRepository.ts`

### Existing Frontend Files (WILL BE MODIFIED):
- `/home/user/site-diogo/src/scripts/dashboard.js` (Calculator)
- `/home/user/site-diogo/src/scripts/market-study.js` (Market Study)
- `/home/user/site-diogo/src/scripts/projects-table.js` (Projects)

---

## Agent 1: Calculator Frontend Integration

### Task
Connect `dashboard.js` to existing backend API by replacing localStorage with CalculatorAPI calls.

### Input Files (READ THESE):
1. `/home/user/site-diogo/src/scripts/dashboard.js` - Current implementation using localStorage
2. `/home/user/site-diogo/src/scripts/calculator-api.ts` - API client to use
3. `/home/user/site-diogo/src/scripts/shared-utils.js` - Utility functions (showToast, formatCurrency)

### Existing API Endpoints (DO NOT CREATE - ALREADY EXIST):
- POST `/api/calculator/create` - Creates calculator
- GET `/api/calculator/load?shortCode=` - Loads calculator
- GET `/api/calculator/list?userId=` - Lists user calculators
- POST `/api/calculator/share` - Generates shareable link

### Output File (MODIFY THIS):
- `/home/user/site-diogo/src/scripts/dashboard.js`

### Specific Changes Required:

#### 1. Add Import at Top (Line 1-10 area)
```javascript
// Add after line 9 (after the ImobiUtils import)
import { calculatorAPI, APIError } from './calculator-api.js';
```

#### 2. Replace userId Generation (Lines 498-514)
**CURRENT CODE (REMOVE)**:
```javascript
userId = localStorage.getItem('userId');
// ... localStorage logic
```

**REPLACE WITH**:
```javascript
// Use temporary guest ID for demo (auth will be added later)
userId = 'guest-' + Date.now();
// Store in memory for session
sessionStorage.setItem('userId', userId);
```

#### 3. Replace Form Submission Handler (Around line 550-650)
**FIND**: Form submission that calls `calculateApprovalStatus()`
**ADD AFTER CALCULATION**: Save to API instead of localStorage

```javascript
async function handleCalculatorSubmit(e) {
  e.preventDefault();

  // ... existing validation and calculation logic ...
  const approvalData = calculateApprovalStatus(formData);

  // NEW: Save to API
  try {
    const result = await calculatorAPI.create({
      userId: userId,
      propertyValue: formData.propertyValue,
      captationPercentage: formData.captationPercentage,
      completionDate: {
        month: formData.completionMonth,
        year: formData.completionYear
      },
      habiteSe: formData.habiteSe,
      entryPayments: formData.entryPayments,
      duringConstructionPayments: formData.duringConstructionPayments,
      postConstructionPayments: formData.postConstructionPayments
    });

    showToast('Cálculo salvo com sucesso!', 'success');
    logger.info('Calculator saved with ID:', result.id);

    // Reload calculations table
    await loadUserCalculations();

  } catch (error) {
    if (error instanceof APIError) {
      showToast(`Erro ao salvar: ${error.message}`, 'error');
      logger.error('API Error:', error);
    } else {
      showToast('Erro de rede. Tente novamente.', 'error');
      logger.error('Network error:', error);
    }
  }

  // ... rest of existing display logic ...
}
```

#### 4. Replace loadUserCalculations() Function (Lines 988-1014)
**CURRENT CODE (REMOVE ALL localStorage)**:
```javascript
try {
  const saved = localStorage.getItem('userCalculations');
  // ...
} catch (error) {
  logger.error('Error loading userCalculations from localStorage', error);
}
```

**REPLACE WITH**:
```javascript
async function loadUserCalculations() {
  try {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      logger.warn('No userId found, skipping load');
      return;
    }

    const response = await calculatorAPI.list(userId, 10, 0);
    this.userCalculations = response.calculators || [];

    // Update table
    updateCalculationsTable();

    // Update statistics
    updateStatisticsCards();

    logger.info('Loaded calculations:', this.userCalculations.length);
  } catch (error) {
    if (error instanceof APIError) {
      logger.error('Failed to load calculations:', error.message);
      showToast('Erro ao carregar cálculos anteriores', 'error');
    } else {
      logger.error('Network error loading calculations:', error);
    }
    // Keep empty array on error
    this.userCalculations = [];
  }
}
```

#### 5. Add Shareable Link Button Handler (NEW)
```javascript
// Find the "Gerar Link Compartilhável" button handler
document.getElementById('btnShare')?.addEventListener('click', async () => {
  const currentCalculatorId = /* get current calculator ID from last save */;

  if (!currentCalculatorId) {
    showToast('Salve o cálculo primeiro', 'warning');
    return;
  }

  try {
    const shareUrl = await calculatorAPI.generateShareableLink(
      currentCalculatorId,
      userId
    );

    // Copy to clipboard
    await navigator.clipboard.writeText(shareUrl);
    showToast('Link copiado para área de transferência!', 'success');

    // Show link in modal or alert
    alert(`Link compartilhável:\n${shareUrl}`);

  } catch (error) {
    showToast('Erro ao gerar link', 'error');
    logger.error('Share link error:', error);
  }
});
```

#### 6. Remove ALL localStorage Calls
Search for and remove:
- `localStorage.setItem('userCalculations', ...)`
- `localStorage.getItem('userCalculations')`
- Any other localStorage references related to calculators

### Testing Checklist:
- [ ] Import statement added
- [ ] Form submission saves to API
- [ ] Success toast appears after save
- [ ] Error handling shows appropriate messages
- [ ] Calculations table loads from API
- [ ] Shareable link button works
- [ ] No console errors
- [ ] No localStorage references remain

---

## Agent 2: Market Study Frontend Integration

### Task
Connect `market-study.js` to backend API and uncomment PDF generation.

### Input Files (READ THESE):
1. `/home/user/site-diogo/src/scripts/market-study.js` - Current implementation
2. `/home/user/site-diogo/src/scripts/market-study-api.ts` - API client (NEWLY CREATED)
3. `/home/user/site-diogo/src/scripts/shared-utils.js` - Utility functions

### Existing API Endpoints (DO NOT CREATE - ALREADY EXIST):
- POST `/api/market-study/create` - Creates market study
- GET `/api/market-study/load?id=` - Loads market study
- GET `/api/market-study/list?userId=` - Lists studies
- GET `/api/market-study/generate-pdf?id=` - Generates PDF

### Output File (MODIFY THIS):
- `/home/user/site-diogo/src/scripts/market-study.js`

### Specific Changes Required:

#### 1. Add Import at Top
```javascript
// Add after line 9 (after ImobiUtils)
import { marketStudyAPI, APIError } from './market-study-api.js';
```

#### 2. Update Form Submission Handler
**FIND**: `initFormSubmit()` method (around line 114-180)
**REPLACE** the form submission logic with API call:

```javascript
initFormSubmit() {
  const form = document.getElementById('marketStudyForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate samples
    if (this.samples.length < 3) {
      showToast('Adicione pelo menos 3 imóveis comparáveis', 'warning');
      return;
    }

    // Get form data
    const formData = this.getFormData();

    try {
      // Call API
      const result = await marketStudyAPI.create({
        userId: sessionStorage.getItem('userId') || 'guest-' + Date.now(),
        propertyAddress: {
          street: formData.subjectStreet,
          number: formData.subjectNumber,
          neighborhood: formData.subjectNeighborhood,
          city: formData.subjectCity,
          state: formData.subjectState,
        },
        propertyArea: parseFloat(formData.subjectArea),
        propertyCharacteristics: {
          bedrooms: parseInt(formData.subjectBedrooms),
          bathrooms: parseInt(formData.subjectBathrooms),
          parkingSpots: parseInt(formData.subjectParking),
        },
        samples: this.samples.map(s => ({
          address: s.address,
          area: s.area,
          price: s.price,
          characteristics: s.characteristics
        }))
      });

      // Store study ID for PDF generation
      this.currentStudyId = result.id;

      // Display results
      this.displayResults(result.valuation, result.statisticalAnalysis);

      showToast('Avaliação calculada com sucesso!', 'success');

      // Show PDF button
      document.getElementById('btnGeneratePDF').classList.remove('hidden');

    } catch (error) {
      if (error instanceof APIError) {
        showToast(`Erro: ${error.message}`, 'error');
        logger.error('API Error:', error);
      } else {
        showToast('Erro de rede. Tente novamente.', 'error');
        logger.error('Network error:', error);
      }
    }
  });
}
```

#### 3. Uncomment and Fix PDF Generation (Line 470)
**CURRENT CODE (COMMENTED)**:
```javascript
// window.open(`/api/market-study/generate-pdf?id=${this.currentStudyId}`, '_blank');
```

**REPLACE WITH**:
```javascript
initPDFButton() {
  const btn = document.getElementById('btnGeneratePDF');
  btn.addEventListener('click', async () => {
    if (!this.currentStudyId) {
      showToast('Nenhum estudo para gerar PDF', 'warning');
      return;
    }

    try {
      await marketStudyAPI.generatePDF(this.currentStudyId);
      showToast('PDF gerado! Verifique a nova aba.', 'success');
    } catch (error) {
      showToast('Erro ao gerar PDF', 'error');
      logger.error('PDF generation error:', error);
    }
  });
}
```

#### 4. Add Method to Load Saved Studies (NEW)
```javascript
async loadSavedStudies() {
  try {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    const response = await marketStudyAPI.list(userId, 10, 0);

    // Display in a dropdown or list
    // This is optional - implement if UI has a "Load Previous" button
    logger.info('Loaded studies:', response.studies.length);

  } catch (error) {
    logger.error('Failed to load studies:', error);
  }
}
```

### Testing Checklist:
- [ ] Import statement added
- [ ] Form submission calls API
- [ ] Results display correctly
- [ ] PDF button appears after calculation
- [ ] PDF generation opens in new tab
- [ ] Error handling works
- [ ] No console errors

---

## Agent 3: Projects Backend API Creation

### Task
Create 13 API endpoint files for Projects and Units following existing patterns.

### Input Files (READ THESE - DO NOT MODIFY):
1. `/home/user/site-diogo/api/calculator/create.ts` - PATTERN TO FOLLOW
2. `/home/user/site-diogo/api/calculator/list.ts` - PATTERN TO FOLLOW
3. `/home/user/site-diogo/src/domain/projects/entities/Project.ts` - Domain entity
4. `/home/user/site-diogo/src/domain/projects/entities/Unit.ts` - Domain entity
5. `/home/user/site-diogo/src/infrastructure/database/SupabaseProjectRepository.ts` - Repository to use
6. `/home/user/site-diogo/src/infrastructure/database/SupabaseUnitRepository.ts` - Repository to use
7. `/home/user/site-diogo/src/scripts/projects-api.ts` - API CONTRACT (defines required signatures)

### Pattern to Follow (from calculator/create.ts):
```typescript
import { type IProjectRepository } from '@/domain/projects/repositories/IProjectRepository';
import { Project, ProjectLocation } from '@/domain/projects';
import { CreateProjectSchema } from '@/lib/validators/projects.schema';
import { createSuccessResponse, createErrorResponse } from '@/api/types/responses';
import { ValidationError, DatabaseError, BaseError } from '@/lib/errors';

// Dependency Injection
let repository: IProjectRepository;

export function setRepository(repo: IProjectRepository): void {
  repository = repo;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 1. Parse and validate request
    const body = await req.json();
    const validated = CreateProjectSchema.parse(body);

    // 2. Create domain entity
    const project = new Project({
      userId: validated.userId,
      name: validated.name,
      location: new ProjectLocation(
        validated.location.city,
        validated.location.neighborhood,
        validated.location.state
      ),
      description: validated.description,
    });

    // 3. Save via repository
    const saved = await repository.save(project);

    // 4. Return success response
    return new Response(
      JSON.stringify(
        createSuccessResponse({
          id: saved.getId(),
          name: saved.getName(),
          location: saved.getLocation().toJSON(),
          description: saved.getDescription(),
          createdAt: saved.getCreatedAt().toISOString(),
        })
      ),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Error handling
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify(createErrorResponse(new ValidationError(error.message))),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (error instanceof BaseError) {
      return new Response(
        JSON.stringify(createErrorResponse(error)),
        { status: error instanceof DatabaseError ? 500 : 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(createErrorResponse(new DatabaseError('Internal error'))),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### Output Files (CREATE THESE 13 FILES):

#### 1. `/home/user/site-diogo/api/projects/create.ts`
- Method: POST
- Body: `{ userId, name, location: { city, neighborhood, state }, description }`
- Uses: `SupabaseProjectRepository.save(project)`
- Returns: `{ id, name, location, description, createdAt }`

#### 2. `/home/user/site-diogo/api/projects/load.ts`
- Method: GET
- Query: `?id=project-id`
- Uses: `SupabaseProjectRepository.findById(id)`
- Returns: Full `ProjectData` with units array

#### 3. `/home/user/site-diogo/api/projects/list.ts`
- Method: GET
- Query: `?userId=&limit=&offset=&sortBy=&sortOrder=`
- Uses: `SupabaseProjectRepository.findAll(filters)`
- Returns: `{ projects: ProjectData[], total, limit, offset }`

#### 4. `/home/user/site-diogo/api/projects/update.ts`
- Method: PUT
- Query: `?id=project-id`
- Body: `{ name?, location?, description? }`
- Uses: `SupabaseProjectRepository.update(project)`
- Returns: Updated `ProjectData`

#### 5. `/home/user/site-diogo/api/projects/delete.ts`
- Method: DELETE
- Query: `?id=project-id`
- Uses: `SupabaseProjectRepository.delete(id)`
- Returns: 204 No Content

#### 6. `/home/user/site-diogo/api/projects/statistics.ts`
- Method: GET
- Query: `?id=project-id`
- Uses: `SupabaseProjectRepository.findById(id)` then call `project.getStatistics()`
- Returns: `{ projectId, statistics: { totalUnits, availableUnits, ... } }`

#### 7. `/home/user/site-diogo/api/projects/units-create.ts`
- Method: POST
- Query: `?projectId=project-id`
- Body: `{ tower, number, area, price, parkingSpots, origin, status? }`
- Uses: `SupabaseUnitRepository.save(unit)`
- Returns: `{ id, projectId, tower, number, createdAt }`

#### 8. `/home/user/site-diogo/api/projects/units-list.ts`
- Method: GET
- Query: `?projectId=&status=&tower=&minPrice=&maxPrice=&limit=&offset=`
- Uses: `SupabaseUnitRepository.findAll(filters)`
- Returns: `{ units: UnitData[], total, limit, offset }`

#### 9. `/home/user/site-diogo/api/projects/units-load.ts`
- Method: GET
- Query: `?id=unit-id`
- Uses: `SupabaseUnitRepository.findById(id)`
- Returns: Full `UnitData`

#### 10. `/home/user/site-diogo/api/projects/units-update.ts`
- Method: PUT
- Query: `?id=unit-id&projectId=project-id`
- Body: `{ tower?, number?, area?, price?, parkingSpots?, origin?, status? }`
- Uses: `SupabaseUnitRepository.update(unit)`
- Returns: Updated `UnitData`

#### 11. `/home/user/site-diogo/api/projects/units-delete.ts`
- Method: DELETE
- Query: `?id=unit-id`
- Uses: `SupabaseUnitRepository.delete(id)`
- Returns: 204 No Content

#### 12. `/home/user/site-diogo/api/projects/units-export.ts`
- Method: GET
- Query: `?projectId=project-id`
- Uses: `SupabaseUnitRepository.findByProjectId(projectId)`
- Returns: CSV file (Content-Type: text/csv)
- CSV Format: `tower,number,area,price,parkingSpots,origin,status`

#### 13. `/home/user/site-diogo/api/projects/units-import.ts`
- Method: POST
- Query: `?projectId=project-id`
- Body: FormData with CSV file
- Uses: Parse CSV → `SupabaseUnitRepository.saveMany(units)`
- Returns: `{ added: number, errors: [{ row, error }] }`

### CRITICAL Repository Methods Available:

**SupabaseProjectRepository** (`/home/user/site-diogo/src/infrastructure/database/SupabaseProjectRepository.ts`):
- `async save(project: Project): Promise<Project>` (line 84)
- `async findById(id: string): Promise<Project | null>` (line 165)
- `async findAll(filters?: ProjectFilterOptions): Promise<Project[]>` (line 209)
- `async findByUserId(userId: string, includeShared?: boolean): Promise<Project[]>` (line 283)
- `async update(project: Project): Promise<Project>` (line 334)
- `async delete(id: string): Promise<void>` (line 415)
- `async exists(id: string): Promise<boolean>` (line 452)
- `async count(filters?: ProjectFilterOptions): Promise<number>` (line 487)

**SupabaseUnitRepository** (`/home/user/site-diogo/src/infrastructure/database/SupabaseUnitRepository.ts`):
- `async save(unit: Unit): Promise<Unit>` (line 61)
- `async saveMany(units: Unit[]): Promise<Unit[]>` (line 130)
- `async findById(id: string): Promise<Unit | null>` (line 202)
- `async findByProjectId(projectId: string): Promise<Unit[]>` (line 241)
- `async findAll(filters: UnitFilterOptions): Promise<Unit[]>` (line 282)
- `async update(unit: Unit): Promise<Unit>` (line 371)
- `async updateMany(units: Unit[]): Promise<Unit[]>` (line 441)
- `async delete(id: string): Promise<void>` (line 462)
- `async deleteByProjectId(projectId: string): Promise<number>` (line 499)
- `async count(filters?: UnitFilterOptions): Promise<number>` (line 534)
- `async exists(id: string): Promise<boolean>` (line 577)

### Validation Schemas (CREATE IF NEEDED):
Create `/home/user/site-diogo/src/lib/validators/projects.schema.ts`:
```typescript
import { z } from 'zod';

export const CreateProjectSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(200),
  location: z.object({
    city: z.string().min(1),
    neighborhood: z.string().min(1),
    state: z.string().length(2),
  }),
  description: z.string(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  location: z.object({
    city: z.string().min(1),
    neighborhood: z.string().min(1),
    state: z.string().length(2),
  }).optional(),
  description: z.string().optional(),
});

export const CreateUnitSchema = z.object({
  tower: z.string().min(1).max(10),
  number: z.string().min(1).max(20),
  area: z.number().positive(),
  price: z.number().positive(),
  parkingSpots: z.string(),
  origin: z.enum(['real', 'permutante']),
  status: z.enum(['available', 'reserved', 'sold', 'unavailable']).optional(),
});

export const UpdateUnitSchema = z.object({
  tower: z.string().min(1).max(10).optional(),
  number: z.string().min(1).max(20).optional(),
  area: z.number().positive().optional(),
  price: z.number().positive().optional(),
  parkingSpots: z.string().optional(),
  origin: z.enum(['real', 'permutante']).optional(),
  status: z.enum(['available', 'reserved', 'sold', 'unavailable']).optional(),
});
```

### Testing Checklist (for each endpoint):
- [ ] Correct HTTP method
- [ ] Validates input with Zod
- [ ] Uses correct repository method
- [ ] Returns proper response format (createSuccessResponse/createErrorResponse)
- [ ] Handles errors correctly
- [ ] Sets correct status codes (201 for create, 200 for success, 204 for delete, 400/500 for errors)
- [ ] Sets Content-Type header

---

## Agent 4: Projects Frontend Integration

### Task
Connect `projects-table.js` to Projects API, replacing demo data with real API calls.

### Input Files (READ THESE):
1. `/home/user/site-diogo/src/scripts/projects-table.js` - Current implementation with demo data
2. `/home/user/site-diogo/src/scripts/projects-api.ts` - API client (NEWLY CREATED - THE CONTRACT)
3. `/home/user/site-diogo/src/scripts/shared-utils.js` - Utility functions

### API Contract (FROM projects-api.ts - FOLLOW THIS):
The `projects-api.ts` file defines all methods. Use these exact methods:
- `projectsAPI.createProject(data)`
- `projectsAPI.listProjects(filters)`
- `projectsAPI.createUnit(data)`
- `projectsAPI.listUnits(filters)`
- `projectsAPI.updateUnit(data)`
- `projectsAPI.deleteUnit(projectId, unitId)`
- `projectsAPI.exportUnitsCSV(projectId)`
- `projectsAPI.importUnitsCSV(projectId, file)`

### Output File (MODIFY THIS):
- `/home/user/site-diogo/src/scripts/projects-table.js`

### Specific Changes Required:

#### 1. Add Import at Top
```javascript
// Add after line 9 (after ImobiUtils)
import { projectsAPI, APIError } from './projects-api.js';
```

#### 2. Replace loadDemoData() Method (Lines 23-78)
**CURRENT CODE (REMOVE ALL)**:
```javascript
loadDemoData() {
  this.units = [
    { id: 1, tower: 'A', number: '101', ... },
    // ... hard-coded data
  ];
  this.filteredUnits = [...this.units];
}
```

**REPLACE WITH**:
```javascript
async loadUnits() {
  try {
    // For now, use a default project ID or get from URL/storage
    const projectId = sessionStorage.getItem('currentProjectId') || await this.getOrCreateDefaultProject();

    const response = await projectsAPI.listUnits({
      projectId: projectId,
      limit: 100,
      offset: 0,
    });

    this.units = response.units.map(u => ({
      id: u.id,
      tower: u.tower,
      number: u.number,
      area: u.area,
      price: u.price,
      parking: u.parkingSpots,
      origin: u.origin,
      status: u.status,
    }));

    this.filteredUnits = [...this.units];

    logger.info('Loaded units:', this.units.length);

  } catch (error) {
    if (error instanceof APIError) {
      showToast(`Erro ao carregar unidades: ${error.message}`, 'error');
      logger.error('API Error:', error);
    } else {
      showToast('Erro de rede. Tente novamente.', 'error');
      logger.error('Network error:', error);
    }
    this.units = [];
    this.filteredUnits = [];
  }
}

async getOrCreateDefaultProject() {
  const userId = sessionStorage.getItem('userId') || 'guest-' + Date.now();

  try {
    // Try to get existing projects
    const response = await projectsAPI.listProjects({ userId, limit: 1 });

    if (response.projects.length > 0) {
      const projectId = response.projects[0].id;
      sessionStorage.setItem('currentProjectId', projectId);
      return projectId;
    }

    // Create default project if none exists
    const project = await projectsAPI.createProject({
      userId,
      name: 'Meu Projeto',
      location: { city: 'São Paulo', neighborhood: 'Centro', state: 'SP' },
      description: 'Projeto padrão',
    });

    sessionStorage.setItem('currentProjectId', project.id);
    return project.id;

  } catch (error) {
    logger.error('Failed to get/create project:', error);
    throw error;
  }
}
```

#### 3. Replace init() Method
```javascript
async init() {
  await this.loadUnits();  // Changed from this.loadDemoData()
  this.initFilterButtons();
  this.initActionButtons();
  this.updateStatistics();
  this.renderTable();
}
```

#### 4. Update "Add Unit" Button Handler
```javascript
initActionButtons() {
  const btnAddUnit = document.getElementById('btnAddUnit');

  if (btnAddUnit) {
    btnAddUnit.addEventListener('click', async () => {
      // Show modal/form to add unit (implement UI)
      // For now, we'll use prompt (replace with proper modal)
      const tower = prompt('Torre:');
      const number = prompt('Número:');
      const area = parseFloat(prompt('Área (m²):') || '0');
      const price = parseFloat(prompt('Preço (R$):') || '0');
      const parking = prompt('Vagas de estacionamento:');
      const origin = prompt('Origem (real/permutante):');

      if (!tower || !number || !area || !price || !origin) {
        showToast('Preencha todos os campos', 'warning');
        return;
      }

      try {
        const projectId = sessionStorage.getItem('currentProjectId');

        await projectsAPI.createUnit({
          projectId,
          tower,
          number,
          area,
          price,
          parkingSpots: parking || '0',
          origin: origin as 'real' | 'permutante',
          status: 'available',
        });

        showToast('Unidade adicionada com sucesso!', 'success');

        // Reload table
        await this.loadUnits();
        this.renderTable();
        this.updateStatistics();

      } catch (error) {
        if (error instanceof APIError) {
          showToast(`Erro: ${error.message}`, 'error');
        } else {
          showToast('Erro ao adicionar unidade', 'error');
        }
        logger.error('Create unit error:', error);
      }
    });
  }

  // Export CSV button
  const btnExportCSV = document.getElementById('btnExportCSV');
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', async () => {
      try {
        const projectId = sessionStorage.getItem('currentProjectId');
        const blob = await projectsAPI.exportUnitsCSV(projectId);

        // Download file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `units-${projectId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('CSV exportado com sucesso!', 'success');

      } catch (error) {
        showToast('Erro ao exportar CSV', 'error');
        logger.error('Export error:', error);
      }
    });
  }

  // Import CSV button
  const btnImportCSV = document.getElementById('btnImportCSV');
  if (btnImportCSV) {
    btnImportCSV.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const projectId = sessionStorage.getItem('currentProjectId');
          const result = await projectsAPI.importUnitsCSV(projectId, file);

          showToast(`${result.added} unidades importadas!`, 'success');

          if (result.errors.length > 0) {
            console.warn('Import errors:', result.errors);
            showToast(`${result.errors.length} erros encontrados. Verifique o console.`, 'warning');
          }

          // Reload table
          await this.loadUnits();
          this.renderTable();
          this.updateStatistics();

        } catch (error) {
          showToast('Erro ao importar CSV', 'error');
          logger.error('Import error:', error);
        }
      };

      input.click();
    });
  }
}
```

#### 5. Update Delete Button in Table Rendering
```javascript
// In renderTable() method, when creating action buttons:
const deleteBtn = document.createElement('button');
deleteBtn.className = 'action-btn delete';
deleteBtn.innerHTML = '🗑️';
deleteBtn.addEventListener('click', async () => {
  if (!confirm('Deseja realmente excluir esta unidade?')) return;

  try {
    const projectId = sessionStorage.getItem('currentProjectId');
    await projectsAPI.deleteUnit(projectId, unit.id);

    showToast('Unidade excluída com sucesso!', 'success');

    // Reload table
    await this.loadUnits();
    this.renderTable();
    this.updateStatistics();

  } catch (error) {
    showToast('Erro ao excluir unidade', 'error');
    logger.error('Delete error:', error);
  }
});
```

#### 6. Update Filter Application
```javascript
async applyFilters() {
  const status = document.getElementById('filterStatus').value;
  const origin = document.getElementById('filterOrigin').value;
  const tower = document.getElementById('filterTower').value;

  try {
    const projectId = sessionStorage.getItem('currentProjectId');

    const response = await projectsAPI.listUnits({
      projectId,
      status: status || undefined,
      origin: origin || undefined,
      tower: tower || undefined,
      limit: 100,
      offset: 0,
    });

    this.units = response.units.map(u => ({
      id: u.id,
      tower: u.tower,
      number: u.number,
      area: u.area,
      price: u.price,
      parking: u.parkingSpots,
      origin: u.origin,
      status: u.status,
    }));

    this.filteredUnits = [...this.units];
    this.renderTable();
    this.updateStatistics();

  } catch (error) {
    showToast('Erro ao aplicar filtros', 'error');
    logger.error('Filter error:', error);
  }
}
```

### Testing Checklist:
- [ ] Import statement added
- [ ] Demo data removed
- [ ] Units load from API on init
- [ ] Add unit button works
- [ ] Delete unit button works
- [ ] Export CSV downloads file
- [ ] Import CSV uploads and processes
- [ ] Filters call API with parameters
- [ ] Error handling shows toasts
- [ ] No console errors

---

## Success Criteria (All Agents)

### Code Quality:
- [ ] All TypeScript/JavaScript syntax is valid
- [ ] No console.error() calls (use logger.error())
- [ ] All promises handled with try/catch
- [ ] User-friendly error messages via showToast()
- [ ] No hardcoded data remaining

### Integration:
- [ ] Frontend calls match API contract signatures
- [ ] API endpoints use correct repository methods
- [ ] Response formats match API types
- [ ] All CRUD operations work end-to-end

### Testing:
- [ ] Run `npm run build` - should complete without errors
- [ ] Run `npm run type-check` - should pass
- [ ] Open browser dev console - no errors
- [ ] Test each feature manually

---

## CRITICAL: Avoid Common Mistakes

1. **DON'T invent methods** - Only use methods that exist in repositories
2. **DON'T modify domain entities** - Use them as-is
3. **DON'T change API contract** - Frontend and backend must match projects-api.ts
4. **DON'T use different response formats** - Follow createSuccessResponse/createErrorResponse pattern
5. **DON'T forget error handling** - Every API call needs try/catch
6. **DON'T hardcode IDs** - Use sessionStorage for userId and projectId
7. **DON'T forget imports** - Add all necessary imports at top of file

---

## Coordination

**NO coordination needed between agents!** Each works independently on current codebase.

**After all agents complete**, we will:
1. Commit each agent's changes separately
2. Test integration between frontend and backend
3. Fix any issues discovered
4. Remove localStorage references
5. Test end-to-end functionality

**Questions during work**: Check this document first, then read the source files referenced.
