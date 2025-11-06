import { type IUnitRepository } from '@/domain/projects/repositories/IUnitRepository';
import { ListUnitsSchema } from '@/lib/validators/projects.schema';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/api/types/responses';
import {
  ValidationError,
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
 * GET /api/projects/units-list?projectId=project-id&status=available&tower=A&minPrice=100000&maxPrice=500000&limit=100&offset=0
 *
 * Lists units in a project with optional filters and pagination.
 * Validates query parameters.
 * Retrieves units from repository.
 * Returns array of units with metadata.
 *
 * @param request - HTTP GET request with query parameters
 * @returns Response with list of units
 *
 * @example
 * GET /api/projects/units-list?projectId=proj-abc123&status=available&limit=50
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "units": [
 *       {
 *         "id": "unit-xyz789",
 *         "projectId": "proj-abc123",
 *         "tower": "A",
 *         "number": "101",
 *         "area": 150,
 *         "price": 500000,
 *         "parkingSpots": "2",
 *         "origin": "real",
 *         "status": "available",
 *         "metadata": {},
 *         "createdAt": "2025-11-06T10:00:00.000Z",
 *         "updatedAt": "2025-11-06T10:00:00.000Z"
 *       }
 *     ],
 *     "total": 25,
 *     "limit": 50,
 *     "offset": 0
 *   }
 * }
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // Check if repository is injected
    if (!repository) {
      throw new DatabaseError(
        'Repository not initialized',
        'list'
      );
    }

    // Parse query parameters from URL
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status') || undefined;
    const tower = url.searchParams.get('tower') || undefined;
    const minPrice = url.searchParams.get('minPrice') || undefined;
    const maxPrice = url.searchParams.get('maxPrice') || undefined;
    const minArea = url.searchParams.get('minArea') || undefined;
    const maxArea = url.searchParams.get('maxArea') || undefined;
    const origin = url.searchParams.get('origin') || undefined;
    const limit = url.searchParams.get('limit') || undefined;
    const offset = url.searchParams.get('offset') || undefined;
    const sortBy = url.searchParams.get('sortBy') || undefined;
    const sortOrder = url.searchParams.get('sortOrder') || undefined;

    // Validate query parameters (transforms strings to numbers)
    const validated = ListUnitsSchema.parse({
      projectId,
      status,
      tower,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      origin,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sortBy,
      sortOrder,
    });

    // Build filter options for repository
    const filters = {
      projectId: validated.projectId,
      status: validated.status,
      tower: validated.tower,
      minPrice: validated.minPrice,
      maxPrice: validated.maxPrice,
      minArea: validated.minArea,
      maxArea: validated.maxArea,
      origin: validated.origin,
      limit: validated.limit,
      offset: validated.offset,
      sortBy: validated.sortBy,
      sortOrder: validated.sortOrder,
    };

    // Find units with filters
    const units = await repository.findAll(filters);

    // Get total count for pagination
    const total = await repository.count({
      projectId: validated.projectId,
      status: validated.status,
      tower: validated.tower,
    });

    // Build response data
    const unitsData = units.map((unit) => ({
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
    }));

    const responseData = {
      units: unitsData,
      total,
      limit: validated.limit,
      offset: validated.offset,
    };

    // Return success response with pagination metadata
    return new Response(
      JSON.stringify(
        createSuccessResponse(responseData, {
          timestamp: new Date().toISOString(),
          pagination: {
            page: Math.floor(validated.offset / validated.limit) + 1,
            limit: validated.limit,
            total,
          },
        })
      ),
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
    console.error('Unexpected error in GET /api/projects/units-list:', error);
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
