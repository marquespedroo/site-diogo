# API Endpoints Implementation Guide

## Overview

This guide provides templates for implementing the 8 remaining API endpoints for the Projects Table feature. All domain logic, repositories, and validation schemas are already implemented.

---

## Common Patterns

### Authentication
```typescript
import { createClient } from '@supabase/supabase-js';

// Get authenticated user
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const { data: { user }, error } = await supabase.auth.getUser(
  req.headers.authorization?.replace('Bearer ', '')
);

if (error || !user) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Error Handling
```typescript
import { ValidationError, NotFoundError, BusinessRuleError, DatabaseError } from '../../src/lib/errors';

try {
  // ... endpoint logic
} catch (error) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message, details: error.details });
  }
  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message });
  }
  if (error instanceof BusinessRuleError) {
    return res.status(422).json({ error: error.message, rule: error.rule });
  }
  if (error instanceof DatabaseError) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }

  console.error('Unexpected error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}
```

---

## 1. Create Project

**File**: `/home/user/site-diogo/api/projects/create.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { CreateProjectSchema } from '../../src/lib/validators/projects.schema';
import { SupabaseProjectRepository } from '../../src/infrastructure/database/SupabaseProjectRepository';
import { Project } from '../../src/domain/projects/entities/Project';
import { ProjectLocation } from '../../src/domain/projects/value-objects/ProjectLocation';
import { ValidationError } from '../../src/lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    const validated = CreateProjectSchema.parse({
      ...req.body,
      userId: user.id, // Use authenticated user ID
    });

    // Create project entity
    const project = new Project({
      userId: validated.userId,
      name: validated.name,
      location: ProjectLocation.fromJSON(validated.location),
      description: validated.description,
    });

    // Save to database
    const repository = new SupabaseProjectRepository(supabase);
    const saved = await repository.save(project);

    // Return response
    return res.status(201).json({
      success: true,
      project: saved.toJSON(),
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ValidationError || (error as any).name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: (error as any).errors || error.message,
      });
    }

    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 2. List Projects

**File**: `/home/user/site-diogo/api/projects/list.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { ListProjectsSchema } from '../../src/lib/validators/projects.schema';
import { SupabaseProjectRepository } from '../../src/infrastructure/database/SupabaseProjectRepository';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate query parameters
    const validated = ListProjectsSchema.parse({
      ...req.query,
      userId: user.id, // Filter by authenticated user
    });

    // Fetch projects
    const repository = new SupabaseProjectRepository(supabase);
    const projects = await repository.findByUserId(
      user.id,
      validated.includeShared
    );

    // Return response
    return res.status(200).json({
      success: true,
      projects: projects.map(p => p.toJSON()),
      total: projects.length,
    });
  } catch (error) {
    console.error('Error listing projects:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 3. Get Project

**File**: `/home/user/site-diogo/api/projects/get.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GetProjectSchema } from '../../src/lib/validators/projects.schema';
import { SupabaseProjectRepository } from '../../src/infrastructure/database/SupabaseProjectRepository';
import { NotFoundError } from '../../src/lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate query parameters
    const validated = GetProjectSchema.parse(req.query);

    // Fetch project
    const repository = new SupabaseProjectRepository(supabase);
    const project = await repository.findById(validated.id);

    if (!project) {
      throw new NotFoundError('Project', validated.id);
    }

    // Check access
    if (!project.hasAccess(user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Return response with statistics
    return res.status(200).json({
      success: true,
      project: project.toJSON(),
      statistics: project.getStatistics(),
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    console.error('Error getting project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 4. Update Project

**File**: `/home/user/site-diogo/api/projects/update.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { UpdateProjectSchema } from '../../src/lib/validators/projects.schema';
import { SupabaseProjectRepository } from '../../src/infrastructure/database/SupabaseProjectRepository';
import { ProjectLocation } from '../../src/domain/projects/value-objects/ProjectLocation';
import { NotFoundError } from '../../src/lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow PUT
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    const validated = UpdateProjectSchema.parse(req.body);

    // Fetch project
    const repository = new SupabaseProjectRepository(supabase);
    const project = await repository.findById(validated.id);

    if (!project) {
      throw new NotFoundError('Project', validated.id);
    }

    // Check if user can edit
    if (!project.canEdit(user.id)) {
      return res.status(403).json({ error: 'Only project owner can edit' });
    }

    // Update project
    const updates: any = {};
    if (validated.name) updates.name = validated.name;
    if (validated.location) updates.location = ProjectLocation.fromJSON(validated.location);
    if (validated.description !== undefined) updates.description = validated.description;

    project.update(updates);

    // Save
    const updated = await repository.update(project);

    // Return response
    return res.status(200).json({
      success: true,
      project: updated.toJSON(),
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    console.error('Error updating project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 5. Create Unit

**File**: `/home/user/site-diogo/api/projects/units/create.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { CreateUnitSchema } from '../../../src/lib/validators/projects.schema';
import { SupabaseProjectRepository } from '../../../src/infrastructure/database/SupabaseProjectRepository';
import { Unit } from '../../../src/domain/projects/entities/Unit';
import { UnitIdentifier } from '../../../src/domain/projects/value-objects/UnitIdentifier';
import { PropertyArea } from '../../../src/domain/calculator/value-objects/PropertyArea';
import { Money } from '../../../src/domain/calculator/value-objects/Money';
import { NotFoundError, BusinessRuleError } from '../../../src/lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    const validated = CreateUnitSchema.parse(req.body);

    // Fetch project
    const repository = new SupabaseProjectRepository(supabase);
    const project = await repository.findById(validated.projectId);

    if (!project) {
      throw new NotFoundError('Project', validated.projectId);
    }

    // Check if user can edit
    if (!project.canEdit(user.id)) {
      return res.status(403).json({ error: 'Only project owner can add units' });
    }

    // Create unit
    const unit = new Unit({
      projectId: validated.projectId,
      identifier: new UnitIdentifier(validated.tower, validated.unitNumber),
      area: new PropertyArea(validated.area),
      price: new Money(validated.price),
      parkingSpots: validated.parkingSpots,
      origin: validated.origin,
    });

    // Add to project
    project.addUnit(unit);

    // Save
    const updated = await repository.update(project);

    // Return response
    return res.status(201).json({
      success: true,
      unit: unit.toJSON(),
      project: updated.toJSON(),
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof BusinessRuleError) {
      return res.status(422).json({ error: error.message, rule: error.rule });
    }

    console.error('Error creating unit:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 6. Update Unit Status

**File**: `/home/user/site-diogo/api/projects/units/update.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { UpdateUnitStatusSchema } from '../../../src/lib/validators/projects.schema';
import { SupabaseUnitRepository } from '../../../src/infrastructure/database/SupabaseUnitRepository';
import { Money } from '../../../src/domain/calculator/value-objects/Money';
import { NotFoundError } from '../../../src/lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow PUT
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    const validated = UpdateUnitStatusSchema.parse(req.body);

    // Fetch unit
    const repository = new SupabaseUnitRepository(supabase);
    const unit = await repository.findById(validated.unitId);

    if (!unit) {
      throw new NotFoundError('Unit', validated.unitId);
    }

    // Update status
    if (validated.status === 'sold' && validated.metadata) {
      const soldDate = validated.metadata.soldDate ? new Date(validated.metadata.soldDate) : new Date();
      const soldPrice = validated.metadata.soldPrice ? new Money(validated.metadata.soldPrice) : undefined;
      unit.markAsSold(soldDate, soldPrice);
    } else if (validated.status === 'reserved' && validated.metadata) {
      unit.markAsReserved(
        validated.metadata.reservedBy || user.id,
        new Date(validated.metadata.reservedUntil || Date.now() + 7 * 24 * 60 * 60 * 1000)
      );
    } else if (validated.status === 'available') {
      unit.markAsAvailable();
    } else if (validated.status === 'unavailable') {
      unit.markAsUnavailable();
    }

    // Save
    const updated = await repository.update(unit);

    // Return response
    return res.status(200).json({
      success: true,
      unit: updated.toJSON(),
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    console.error('Error updating unit:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 7. Bulk Import Units

**File**: `/home/user/site-diogo/api/projects/units/bulk-import.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { BulkImportUnitsSchema } from '../../../src/lib/validators/projects.schema';
import { SupabaseProjectRepository } from '../../../src/infrastructure/database/SupabaseProjectRepository';
import { Unit } from '../../../src/domain/projects/entities/Unit';
import { UnitIdentifier } from '../../../src/domain/projects/value-objects/UnitIdentifier';
import { PropertyArea } from '../../../src/domain/calculator/value-objects/PropertyArea';
import { Money } from '../../../src/domain/calculator/value-objects/Money';
import { NotFoundError } from '../../../src/lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    const validated = BulkImportUnitsSchema.parse(req.body);

    // Fetch project
    const repository = new SupabaseProjectRepository(supabase);
    const project = await repository.findById(validated.projectId);

    if (!project) {
      throw new NotFoundError('Project', validated.projectId);
    }

    // Check if user can edit
    if (!project.canEdit(user.id)) {
      return res.status(403).json({ error: 'Only project owner can import units' });
    }

    // Create units
    const units = validated.units.map(unitData => new Unit({
      projectId: validated.projectId,
      identifier: new UnitIdentifier(unitData.tower, unitData.unitNumber),
      area: new PropertyArea(unitData.area),
      price: new Money(unitData.price),
      parkingSpots: unitData.parkingSpots,
      origin: unitData.origin,
    }));

    // Bulk add
    const result = project.addUnits(units);

    // Save
    const updated = await repository.update(project);

    // Return response
    return res.status(200).json({
      success: true,
      imported: result.added,
      errors: result.errors.map(e => ({
        unit: e.unit.toJSON(),
        error: e.error,
      })),
      project: updated.toJSON(),
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    console.error('Error importing units:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 8. Export Units to CSV

**File**: `/home/user/site-diogo/api/projects/units/export.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { ExportUnitsSchema } from '../../../src/lib/validators/projects.schema';
import { SupabaseProjectRepository } from '../../../src/infrastructure/database/SupabaseProjectRepository';
import { UnitCSVExporter } from '../../../src/lib/utils/csv';
import { NotFoundError } from '../../../src/lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate query parameters
    const validated = ExportUnitsSchema.parse(req.query);

    // Fetch project
    const repository = new SupabaseProjectRepository(supabase);
    const project = await repository.findById(validated.projectId);

    if (!project) {
      throw new NotFoundError('Project', validated.projectId);
    }

    // Check access
    if (!project.hasAccess(user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Filter units
    let units = project.getUnits();
    if (validated.status) {
      units = units.filter(u => u.getStatus() === validated.status);
    }
    if (validated.tower) {
      units = units.filter(u => u.getIdentifier().getTower() === validated.tower);
    }

    // Generate CSV
    const csv = UnitCSVExporter.export(Array.from(units), project.getName());

    // Set headers
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="project-${validated.projectId}-units.csv"`
    );

    // Return CSV
    return res.status(200).send('\ufeff' + csv); // Add BOM for Excel compatibility
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    console.error('Error exporting units:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Testing the Endpoints

### Using cURL

```bash
# Create project
curl -X POST http://localhost:3000/api/projects/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Torre Azul",
    "location": {
      "city": "São Paulo",
      "neighborhood": "Vila Mariana",
      "state": "SP"
    },
    "description": "Empreendimento de alto padrão"
  }'

# List projects
curl http://localhost:3000/api/projects/list \
  -H "Authorization: Bearer <token>"

# Get project
curl http://localhost:3000/api/projects/get?id=<project-id> \
  -H "Authorization: Bearer <token>"

# Add unit
curl -X POST http://localhost:3000/api/projects/units/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "<project-id>",
    "tower": "A",
    "unitNumber": "101",
    "area": 150,
    "price": 500000,
    "parkingSpots": "2",
    "origin": "real"
  }'

# Export CSV
curl http://localhost:3000/api/projects/units/export?projectId=<project-id> \
  -H "Authorization: Bearer <token>" \
  -o units.csv
```

---

## Environment Setup

```env
# .env.local
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Next Steps

1. Create the 8 API endpoint files above
2. Test each endpoint with sample data
3. Add rate limiting (optional)
4. Add request logging (optional)
5. Deploy to production

---

*All domain logic, repositories, and utilities are already implemented. These endpoints are just thin wrappers around the existing business logic.*
