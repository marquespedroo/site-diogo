import { type IProjectRepository } from '@/domain/projects/repositories/IProjectRepository';
import { Project } from '@/domain/projects/entities/Project';
import { ProjectLocation } from '@/domain/projects/value-objects/ProjectLocation';
import { CreateProjectSchema } from '@/lib/validators/projects.schema';
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
 * POST /api/projects/create
 *
 * Creates a new project with validation and persistence.
 * Validates request body against CreateProjectSchema.
 * Constructs Project entity from request data.
 * Persists project via repository.
 * Returns project details.
 *
 * @param request - HTTP POST request with project data in body
 * @returns Response with project details
 *
 * @example
 * POST /api/projects/create
 * Content-Type: application/json
 *
 * {
 *   "userId": "user-123",
 *   "name": "Torre Azul",
 *   "location": {
 *     "city": "São Paulo",
 *     "neighborhood": "Vila Mariana",
 *     "state": "SP"
 *   },
 *   "description": "Luxury apartments"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "proj-abc123",
 *     "name": "Torre Azul",
 *     "location": {
 *       "city": "São Paulo",
 *       "neighborhood": "Vila Mariana",
 *       "state": "SP"
 *     },
 *     "description": "Luxury apartments",
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

    // Parse request body
    const body = await request.json();

    // Validate request with Zod schema
    const validated = CreateProjectSchema.parse(body);

    // Construct ProjectLocation value object
    const location = new ProjectLocation(
      validated.location.city,
      validated.location.neighborhood,
      validated.location.state
    );

    // Create Project aggregate root
    const project = new Project({
      userId: validated.userId,
      name: validated.name,
      location,
      description: validated.description,
    });

    // Persist via repository
    const savedProject = await repository.save(project);

    // Build response data
    const responseData = {
      id: savedProject.getId(),
      name: savedProject.getName(),
      location: savedProject.getLocation().toJSON(),
      description: savedProject.getDescription(),
      createdAt: savedProject.getCreatedAt().toISOString(),
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
    console.error('Unexpected error in POST /api/projects/create:', error);
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
