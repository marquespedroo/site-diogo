import { type IProjectRepository } from '@/domain/projects/repositories/IProjectRepository';
import { ListProjectsSchema } from '@/lib/validators/projects.schema';
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
 * GET /api/projects/list?userId=user-123&limit=50&offset=0&sortBy=createdAt&sortOrder=desc
 *
 * Lists all projects for a user with optional filters and pagination.
 * Validates query parameters.
 * Retrieves projects from repository.
 * Returns array of project summaries with metadata.
 *
 * @param request - HTTP GET request with query parameters
 * @returns Response with list of projects
 *
 * @example
 * GET /api/projects/list?userId=user-123&limit=20&sortBy=name&sortOrder=asc
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "projects": [
 *       {
 *         "id": "proj-abc123",
 *         "userId": "user-123",
 *         "name": "Torre Azul",
 *         "location": {
 *           "city": "São Paulo",
 *           "neighborhood": "Vila Mariana",
 *           "state": "SP"
 *         },
 *         "description": "Luxury apartments",
 *         "units": [...],
 *         "sharedWith": [],
 *         "createdAt": "2025-11-06T10:00:00.000Z",
 *         "updatedAt": "2025-11-06T10:00:00.000Z"
 *       }
 *     ],
 *     "total": 15,
 *     "limit": 20,
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
    const userId = url.searchParams.get('userId') || undefined;
    const city = url.searchParams.get('city') || undefined;
    const state = url.searchParams.get('state') || undefined;
    const searchTerm = url.searchParams.get('searchTerm') || undefined;
    const limit = url.searchParams.get('limit') || undefined;
    const offset = url.searchParams.get('offset') || undefined;
    const sortBy = url.searchParams.get('sortBy') || undefined;
    const sortOrder = url.searchParams.get('sortOrder') || undefined;

    // Validate query parameters (transforms strings to numbers)
    const validated = ListProjectsSchema.parse({
      userId,
      city,
      state,
      searchTerm,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sortBy,
      sortOrder,
    });

    // Build filter options for repository
    const filters = {
      userId: validated.userId,
      city: validated.city,
      state: validated.state,
      searchTerm: validated.searchTerm,
      limit: validated.limit,
      offset: validated.offset,
      sortBy: validated.sortBy,
      sortOrder: validated.sortOrder,
    };

    // Find projects with filters
    const projects = await repository.findAll(filters);

    // Get total count for pagination
    const total = await repository.count({
      userId: validated.userId,
      city: validated.city,
      state: validated.state,
    });

    // Build response data
    const projectsData = projects.map((project) => {
      const units = project.getUnits().map((unit) => ({
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

      return {
        id: project.getId(),
        userId: project.getUserId(),
        name: project.getName(),
        location: project.getLocation().toJSON(),
        description: project.getDescription(),
        units,
        sharedWith: Array.from(project.getSharedWith()),
        createdAt: project.getCreatedAt().toISOString(),
        updatedAt: project.getUpdatedAt().toISOString(),
      };
    });

    const responseData = {
      projects: projectsData,
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
    console.error('Unexpected error in GET /api/projects/list:', error);
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
