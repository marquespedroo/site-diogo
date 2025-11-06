import { type IUnitRepository } from '@/domain/projects/repositories/IUnitRepository';
import { DeleteUnitSchema } from '@/lib/validators/projects.schema';
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
 * DELETE /api/projects/units-delete?id=unit-id
 *
 * Deletes a unit by its ID.
 * Validates id query parameter.
 * Deletes unit from repository.
 * Returns 204 No Content on success.
 *
 * @param request - HTTP DELETE request with id query parameter
 * @returns Response with 204 status code
 *
 * @example
 * DELETE /api/projects/units-delete?id=unit-xyz789
 *
 * Response: 204 No Content
 */
export async function DELETE(request: Request): Promise<Response> {
  try {
    // Check if repository is injected
    if (!repository) {
      throw new DatabaseError(
        'Repository not initialized',
        'delete'
      );
    }

    // Parse query parameters from URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // Validate query parameters
    const validated = DeleteUnitSchema.parse({ id });

    // Check if unit exists
    const exists = await repository.exists(validated.id);

    if (!exists) {
      throw new NotFoundError('Unit', validated.id);
    }

    // Delete unit
    await repository.delete(validated.id);

    // Return 204 No Content
    return new Response(null, {
      status: 204,
    });
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
    console.error('Unexpected error in DELETE /api/projects/units-delete:', error);
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
