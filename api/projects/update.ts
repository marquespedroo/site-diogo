import { type IProjectRepository } from '@/domain/projects/repositories/IProjectRepository';
import { ProjectLocation } from '@/domain/projects/value-objects/ProjectLocation';
import { UpdateProjectSchema } from '@/lib/validators/projects.schema';
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
 * PUT /api/projects/update?id=project-id
 *
 * Updates an existing project.
 * Validates request body against UpdateProjectSchema.
 * Updates project entity and persists changes.
 * Returns updated project data.
 *
 * @param request - HTTP PUT request with id query parameter and update data in body
 * @returns Response with updated project data
 *
 * @example
 * PUT /api/projects/update?id=proj-abc123
 * Content-Type: application/json
 *
 * {
 *   "name": "Torre Azul Residencial",
 *   "description": "Updated description"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "proj-abc123",
 *     "userId": "user-123",
 *     "name": "Torre Azul Residencial",
 *     "location": {...},
 *     "description": "Updated description",
 *     "units": [...],
 *     "sharedWith": [],
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

    if (!id) {
      throw new ValidationError('Project ID is required in query parameter', [
        { field: 'id', message: 'Project ID is required' },
      ]);
    }

    // Parse request body
    const body = await request.json();

    // Validate request with Zod schema (adds id to body for validation)
    const validated = UpdateProjectSchema.parse({ id, ...body });

    // Find existing project
    const project = await repository.findById(validated.id);

    if (!project) {
      throw new NotFoundError('Project', validated.id);
    }

    // Build updates object
    const updates: {
      name?: string;
      location?: ProjectLocation;
      description?: string;
    } = {};

    if (validated.name !== undefined) {
      updates.name = validated.name;
    }

    if (validated.location !== undefined) {
      updates.location = new ProjectLocation(
        validated.location.city,
        validated.location.neighborhood,
        validated.location.state
      );
    }

    if (validated.description !== undefined) {
      updates.description = validated.description;
    }

    // Update project entity
    project.update(updates);

    // Persist updated project
    const updatedProject = await repository.update(project);

    // Build response data
    const units = updatedProject.getUnits().map((unit) => ({
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
      id: updatedProject.getId(),
      userId: updatedProject.getUserId(),
      name: updatedProject.getName(),
      location: updatedProject.getLocation().toJSON(),
      description: updatedProject.getDescription(),
      units,
      sharedWith: Array.from(updatedProject.getSharedWith()),
      createdAt: updatedProject.getCreatedAt().toISOString(),
      updatedAt: updatedProject.getUpdatedAt().toISOString(),
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
    console.error('Unexpected error in PUT /api/projects/update:', error);
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
