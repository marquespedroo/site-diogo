import { type IProjectRepository } from '@/domain/projects/repositories/IProjectRepository';
import { GetProjectSchema } from '@/lib/validators/projects.schema';
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
 * Project Repository Instance
 * Injected at runtime via setRepository()
 */
let repository: IProjectRepository;

/**
 * Set the repository instance (Dependency Injection)
 * Called by the DI container at application startup
 *
 * @param repo - Project repository implementation
 */
export function setRepository(repo: IProjectRepository): void {
  repository = repo;
}

/**
 * GET /api/projects/statistics?id=project-id
 *
 * Gets statistics for a project.
 * Validates id query parameter.
 * Retrieves project and calls getStatistics() method.
 * Returns project statistics.
 *
 * @param request - HTTP GET request with id query parameter
 * @returns Response with project statistics
 *
 * @example
 * GET /api/projects/statistics?id=proj-abc123
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "projectId": "proj-abc123",
 *     "statistics": {
 *       "totalUnits": 50,
 *       "availableUnits": 20,
 *       "soldUnits": 25,
 *       "reservedUnits": 5,
 *       "totalValue": 25000000,
 *       "averagePricePerSqM": 8500,
 *       "minPrice": 350000,
 *       "maxPrice": 850000
 *     }
 *   }
 * }
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // Check if repository is injected
    if (!repository) {
      throw new DatabaseError(
        'Repository not initialized',
        'statistics'
      );
    }

    // Parse query parameters from URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // Validate query parameters
    const validated = GetProjectSchema.parse({ id });

    // Find project by ID
    const project = await repository.findById(validated.id);

    if (!project) {
      throw new NotFoundError('Project', validated.id);
    }

    // Get project statistics
    const stats = project.getStatistics();

    // Build response data
    const responseData = {
      projectId: project.getId(),
      statistics: {
        totalUnits: stats.totalUnits,
        availableUnits: stats.availableUnits,
        soldUnits: stats.soldUnits,
        reservedUnits: stats.reservedUnits,
        totalValue: stats.totalValue.getAmount(),
        averagePricePerSqM: stats.averagePricePerSqM.getAmount(),
        minPrice: stats.minPrice.getAmount(),
        maxPrice: stats.maxPrice.getAmount(),
      },
    };

    // Return success response
    return new Response(
      JSON.stringify(createSuccessResponse(responseData)),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60',
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
    console.error('Unexpected error in GET /api/projects/statistics:', error);
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
