import { type IUnitRepository } from '@/domain/projects/repositories/IUnitRepository';
import { Unit } from '@/domain/projects/entities/Unit';
import { UnitIdentifier } from '@/domain/projects/value-objects/UnitIdentifier';
import { PropertyArea } from '@/domain/calculator/value-objects/PropertyArea';
import { Money } from '@/domain/calculator/value-objects/Money';
import { UpdateUnitStatusSchema } from '@/lib/validators/projects.schema';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/api/types/responses';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  BaseError,
} from '@/lib/errors';
import { ZodError, z } from 'zod';

/**
 * Unit Repository Instance
 * Injected at runtime via setRepository()
 */
let repository: IUnitRepository;

/**
 * Set the repository instance (Dependency Injection)
 * Called by the DI container at application startup
 *
 * @param repo - Unit repository implementation
 */
export function setRepository(repo: IUnitRepository): void {
  repository = repo;
}

/**
 * Update Unit Request Schema (local validation)
 */
const UpdateUnitRequestSchema = z.object({
  tower: z.string().min(1).max(10).optional(),
  unitNumber: z.string().min(1).max(20).optional(),
  area: z.number().positive().optional(),
  price: z.number().positive().optional(),
  parkingSpots: z.string().optional(),
  origin: z.enum(['real', 'permutante']).optional(),
  status: z.enum(['available', 'reserved', 'sold', 'unavailable']).optional(),
});

/**
 * PUT /api/projects/units-update?id=unit-id&projectId=project-id
 *
 * Updates an existing unit.
 * Validates request body.
 * Updates unit entity and persists changes.
 * Returns updated unit data.
 *
 * @param request - HTTP PUT request with id and projectId query parameters and update data in body
 * @returns Response with updated unit data
 *
 * @example
 * PUT /api/projects/units-update?id=unit-xyz789&projectId=proj-abc123
 * Content-Type: application/json
 *
 * {
 *   "price": 520000,
 *   "status": "reserved"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "unit-xyz789",
 *     "projectId": "proj-abc123",
 *     "tower": "A",
 *     "number": "101",
 *     "area": 150,
 *     "price": 520000,
 *     "parkingSpots": "2",
 *     "origin": "real",
 *     "status": "reserved",
 *     "metadata": {},
 *     "createdAt": "2025-11-06T10:00:00.000Z",
 *     "updatedAt": "2025-11-06T10:30:00.000Z"
 *   }
 * }
 */
export async function PUT(request: Request): Promise<Response> {
  try {
    // Check if repository is injected
    if (!repository) {
      throw new DatabaseError(
        'Repository not initialized',
        'update'
      );
    }

    // Parse query parameters from URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const projectId = url.searchParams.get('projectId');

    if (!id) {
      throw new ValidationError('Unit ID is required in query parameter', [
        { field: 'id', message: 'Unit ID is required' },
      ]);
    }

    if (!projectId) {
      throw new ValidationError('Project ID is required in query parameter', [
        { field: 'projectId', message: 'Project ID is required' },
      ]);
    }

    // Parse request body
    const body = await request.json();

    // Validate request with local schema
    const validated = UpdateUnitRequestSchema.parse(body);

    // Find existing unit
    const existingUnit = await repository.findById(id);

    if (!existingUnit) {
      throw new NotFoundError('Unit', id);
    }

    // Build new unit with updated values
    const identifier = validated.tower || validated.unitNumber
      ? new UnitIdentifier(
          validated.tower || existingUnit.getIdentifier().getTower(),
          validated.unitNumber || existingUnit.getIdentifier().getNumber()
        )
      : existingUnit.getIdentifier();

    const area = validated.area
      ? new PropertyArea(validated.area)
      : existingUnit.getArea();

    const price = validated.price
      ? new Money(validated.price)
      : existingUnit.getPrice();

    const parkingSpots = validated.parkingSpots !== undefined
      ? validated.parkingSpots
      : existingUnit.getParkingSpots();

    const origin = validated.origin !== undefined
      ? validated.origin
      : existingUnit.getOrigin();

    const status = validated.status !== undefined
      ? validated.status
      : existingUnit.getStatus();

    // Create updated unit entity
    const updatedUnit = new Unit({
      id: existingUnit.getId(),
      projectId: existingUnit.getProjectId(),
      identifier,
      area,
      price,
      parkingSpots,
      origin,
      status,
      metadata: existingUnit.getMetadata() as Map<string, any>,
      createdAt: existingUnit.getCreatedAt(),
      updatedAt: new Date(),
    });

    // Persist updated unit
    const savedUnit = await repository.update(updatedUnit);

    // Build response data
    const responseData = {
      id: savedUnit.getId(),
      projectId: savedUnit.getProjectId(),
      tower: savedUnit.getIdentifier().getTower(),
      number: savedUnit.getIdentifier().getNumber(),
      area: savedUnit.getArea().getSquareMeters(),
      price: savedUnit.getPrice().getAmount(),
      parkingSpots: savedUnit.getParkingSpots(),
      origin: savedUnit.getOrigin(),
      status: savedUnit.getStatus(),
      metadata: Object.fromEntries(savedUnit.getMetadata()),
      createdAt: savedUnit.getCreatedAt().toISOString(),
      updatedAt: savedUnit.getUpdatedAt().toISOString(),
    };

    // Return success response
    return new Response(
      JSON.stringify(createSuccessResponse(responseData)),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const validationError = new ValidationError(
        'Invalid request data',
        error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );

      return new Response(
        JSON.stringify(
          createErrorResponse(
            validationError.code,
            validationError.message,
            validationError.details
          )
        ),
        {
          status: validationError.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle custom application errors
    if (error instanceof BaseError) {
      return new Response(
        JSON.stringify(
          createErrorResponse(
            error.code,
            error.message,
            error.toJSON()
          )
        ),
        {
          status: error.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle domain validation errors (from value objects/entities)
    if (error instanceof Error) {
      return new Response(
        JSON.stringify(
          createErrorResponse(
            'DOMAIN_VALIDATION_ERROR',
            error.message
          )
        ),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error in PUT /api/projects/units-update:', error);
    return new Response(
      JSON.stringify(
        createErrorResponse(
          'INTERNAL_SERVER_ERROR',
          'An unexpected error occurred'
        )
      ),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
