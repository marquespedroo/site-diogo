import { type IUnitRepository } from '@/domain/projects/repositories/IUnitRepository';
import { GetUnitSchema } from '@/lib/validators/projects.schema';
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
import { z } from 'zod';

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
 * GET /api/projects/units-load?id=unit-id
 *
 * Loads a unit by its ID.
 * Validates id query parameter.
 * Retrieves unit from repository.
 * Returns full unit data.
 *
 * @param request - HTTP GET request with id query parameter
 * @returns Response with unit data
 *
 * @example
 * GET /api/projects/units-load?id=unit-xyz789
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
 *     "price": 500000,
 *     "parkingSpots": "2",
 *     "origin": "real",
 *     "status": "available",
 *     "metadata": {},
 *     "createdAt": "2025-11-06T10:00:00.000Z",
 *     "updatedAt": "2025-11-06T10:00:00.000Z"
 *   }
 * }
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // Check if repository is injected
    if (!repository) {
      throw new DatabaseError(
        'Repository not initialized',
        'load'
      );
    }

    // Parse query parameters from URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // Validate query parameters
    const validated = GetUnitSchema.parse({ id });

    // Find unit by ID
    const unit = await repository.findById(validated.id);

    if (!unit) {
      throw new NotFoundError('Unit', validated.id);
    }

    // Build response data
    const responseData = {
      id: unit.getId(),
      projectId: unit.getProjectId(),
      tower: unit.getIdentifier().getTower(),
      number: unit.getIdentifier().getNumber(),
      area: unit.getArea().getSquareMeters(),
      price: unit.getPrice().getAmount(),
      parkingSpots: unit.getParkingSpots(),
      origin: unit.getOrigin(),
      status: unit.getStatus(),
      metadata: Object.fromEntries(unit.getMetadata()),
      createdAt: unit.getCreatedAt().toISOString(),
      updatedAt: unit.getUpdatedAt().toISOString(),
    };

    // Return success response
    return new Response(
      JSON.stringify(createSuccessResponse(responseData)),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=30',
        },
      }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        'Invalid query parameters',
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

    // Handle unexpected errors
    console.error('Unexpected error in GET /api/projects/units-load:', error);
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
