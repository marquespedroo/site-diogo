import { type IMarketStudyRepository } from '@/domain/market-study/repositories/IMarketStudyRepository';
import { LoadMarketStudySchema } from '@/lib/validators/market-study.schema';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/api/types/responses';
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  BaseError,
} from '@/lib/errors';
import { ZodError } from 'zod';

/**
 * Market Study Repository Instance
 * Injected at runtime via setRepository()
 */
let repository: IMarketStudyRepository;

/**
 * Set the repository instance (Dependency Injection)
 *
 * @param repo - Market study repository implementation
 */
export function setRepository(repo: IMarketStudyRepository): void {
  repository = repo;
}

/**
 * GET /api/market-study/load?id={id}&userId={userId}
 *
 * Loads a market study by ID.
 * Verifies user ownership before returning data.
 *
 * @param request - HTTP GET request with query parameters
 * @returns Response with complete market study data
 *
 * @example
 * GET /api/market-study/load?id=study-123&userId=user-123
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "study-123",
 *     "userId": "user-123",
 *     "propertyAddress": { ... },
 *     "propertyArea": 90,
 *     "propertyCharacteristics": { ... },
 *     "evaluationType": "sale",
 *     "samples": [ ... ],
 *     "analysis": { ... },
 *     "valuations": [ ... ],
 *     "selectedStandard": "renovated",
 *     "recommendedValuation": { ... },
 *     "createdAt": "2025-01-05T10:00:00.000Z"
 *   }
 * }
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // Check if repository is injected
    if (!repository) {
      throw new DatabaseError('Repository not initialized', 'load');
    }

    // Parse query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');

    // Validate query parameters
    const validated = LoadMarketStudySchema.parse({ id, userId });

    // Find market study by ID
    const marketStudy = await repository.findById(validated.id);

    if (!marketStudy) {
      throw new NotFoundError('Market study', validated.id);
    }

    // Verify user ownership
    if (marketStudy.getUserId() !== validated.userId) {
      throw new UnauthorizedError('You do not have permission to access this market study');
    }

    // Return market study data
    const responseData = marketStudy.toJSON();

    return new Response(JSON.stringify(createSuccessResponse(responseData)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const validationError = new ValidationError(
        'Invalid request parameters',
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
          createErrorResponse(error.code, error.message, error.toJSON())
        ),
        {
          status: error.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error in GET /api/market-study/load:', error);
    return new Response(
      JSON.stringify(
        createErrorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred')
      ),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
