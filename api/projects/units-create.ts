import { type IUnitRepository } from '@/domain/projects/repositories/IUnitRepository';
import { Unit } from '@/domain/projects/entities/Unit';
import { UnitIdentifier } from '@/domain/projects/value-objects/UnitIdentifier';
import { PropertyArea } from '@/domain/calculator/value-objects/PropertyArea';
import { Money } from '@/domain/calculator/value-objects/Money';
import { CreateUnitSchema } from '@/lib/validators/projects.schema';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/api/types/responses';
import {
  ValidationError,
  DatabaseError,
  BaseError,
} from '@/lib/errors';
import { ZodError } from 'zod';

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
 * POST /api/projects/units-create?projectId=project-id
 *
 * Creates a new unit in a project.
 * Validates request body against CreateUnitSchema.
 * Constructs Unit entity from request data.
 * Persists unit via repository.
 * Returns unit details.
 *
 * @param request - HTTP POST request with projectId query parameter and unit data in body
 * @returns Response with unit details
 *
 * @example
 * POST /api/projects/units-create?projectId=proj-abc123
 * Content-Type: application/json
 *
 * {
 *   "tower": "A",
 *   "unitNumber": "101",
 *   "area": 150,
 *   "price": 500000,
 *   "parkingSpots": "2",
 *   "origin": "real"
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
 *     "createdAt": "2025-11-06T10:00:00.000Z"
 *   }
 * }
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Check if repository is injected
    if (!repository) {
      throw new DatabaseError(
        'Repository not initialized',
        'create'
      );
    }

    // Parse query parameters from URL
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      throw new ValidationError('Project ID is required in query parameter', [
        { field: 'projectId', message: 'Project ID is required' },
      ]);
    }

    // Parse request body
    const body = await request.json();

    // Validate request with Zod schema (adds projectId to body for validation)
    const validated = CreateUnitSchema.parse({ projectId, ...body });

    // Construct value objects
    const identifier = new UnitIdentifier(validated.tower, validated.unitNumber);
    const area = new PropertyArea(validated.area);
    const price = new Money(validated.price);

    // Create Unit entity
    const unit = new Unit({
      projectId: validated.projectId,
      identifier,
      area,
      price,
      parkingSpots: validated.parkingSpots,
      origin: validated.origin,
      status: 'available', // Default status
    });

    // Persist via repository
    const savedUnit = await repository.save(unit);

    // Build response data
    const responseData = {
      id: savedUnit.getId(),
      projectId: savedUnit.getProjectId(),
      tower: savedUnit.getIdentifier().getTower(),
      number: savedUnit.getIdentifier().getNumber(),
      createdAt: savedUnit.getCreatedAt().toISOString(),
    };

    // Return success response
    return new Response(
      JSON.stringify(createSuccessResponse(responseData)),
      {
        status: 201,
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
    console.error('Unexpected error in POST /api/projects/units-create:', error);
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
