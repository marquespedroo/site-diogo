import { type IMarketStudyRepository } from '@/domain/market-study/repositories/IMarketStudyRepository';
import { ListMarketStudiesSchema } from '@/lib/validators/market-study.schema';
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
 * GET /api/market-study/list?userId={userId}&limit={limit}&offset={offset}
 *
 * Lists all market studies for a user with pagination.
 * Returns summarized data for listing views.
 *
 * @param request - HTTP GET request with query parameters
 * @returns Response with array of market studies and pagination info
 *
 * @example
 * GET /api/market-study/list?userId=user-123&limit=20&offset=0
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "studies": [
 *       {
 *         "id": "study-123",
 *         "propertyAddress": "Rua das Flores, 123, Centro, São Paulo-SP",
 *         "propertyArea": 90,
 *         "evaluationType": "sale",
 *         "recommendedValuation": {
 *           "totalValue": 450000,
 *           "totalValueFormatted": "R$ 450.000,00"
 *         },
 *         "isReliable": true,
 *         "createdAt": "2025-01-05T10:00:00.000Z"
 *       }
 *     ],
 *     "total": 5
 *   },
 *   "meta": {
 *     "timestamp": "2025-01-05T10:00:00.000Z",
 *     "pagination": {
 *       "page": 1,
 *       "limit": 20,
 *       "total": 5
 *     }
 *   }
 * }
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // Check if repository is injected
    if (!repository) {
      throw new DatabaseError('Repository not initialized', 'list');
    }

    // Parse query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');

    // Validate query parameters
    const validated = ListMarketStudiesSchema.parse({
      userId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    // Find market studies for user
    const marketStudies = await repository.findByUserId(
      validated.userId,
      validated.limit,
      validated.offset
    );

    // Get total count for pagination
    const total = await repository.countByUserId(validated.userId);

    // Build summarized response data
    const studies = marketStudies.map((study) => {
      const recommendedValuation = study.getRecommendedValuation();

      return {
        id: study.getId(),
        propertyAddress: study.getPropertyAddress().toString(),
        propertyArea: study.getPropertyArea().getSquareMeters(),
        evaluationType: study.getEvaluationType(),
        recommendedValuation: recommendedValuation
          ? {
              totalValue: recommendedValuation.getTotalValue().getAmount(),
              totalValueFormatted: recommendedValuation.getTotalValue().format(),
            }
          : null,
        isReliable: study.getAnalysis().isReliable(),
        hasPdfGenerated: study.hasPdfGenerated(),
        createdAt: study.getCreatedAt().toISOString(),
      };
    });

    const responseData = {
      studies,
      total,
    };

    // Calculate pagination info
    const page = Math.floor(validated.offset / validated.limit) + 1;

    return new Response(
      JSON.stringify(
        createSuccessResponse(responseData, {
          pagination: {
            page,
            limit: validated.limit,
            total,
          },
        })
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
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
    console.error('Unexpected error in GET /api/market-study/list:', error);
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
