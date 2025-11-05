import { type ICalculatorRepository } from '@/domain/calculator/repositories/ICalculatorRepository';
import {
  createSuccessResponse,
  createErrorResponse,
  type ListCalculatorsResponse,
} from '@/api/types/responses';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  BaseError,
} from '@/lib/errors';
import { z } from 'zod';

/**
 * Calculator Repository Instance
 * Injected at runtime via setRepository()
 */
let repository: ICalculatorRepository;

/**
 * Set the repository instance (Dependency Injection)
 * Called by the DI container at application startup
 *
 * @param repo - Calculator repository implementation
 */
export function setRepository(repo: ICalculatorRepository): void {
  repository = repo;
}

/**
 * List Calculators Query Schema
 * Validates userId query parameter
 */
const ListCalculatorsQuerySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  limit: z.string().optional().transform((val) => {
    if (!val) return 50;
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1 || num > 100) return 50;
    return num;
  }),
});

/**
 * GET /api/calculator/list?userId=user-123&limit=50
 *
 * Lists all calculators for a specific user.
 * Validates userId query parameter.
 * Retrieves calculators from repository.
 * Returns array of calculator summaries with approval status.
 *
 * @param request - HTTP GET request with userId query parameter
 * @returns Response with list of calculators
 *
 * @example
 * GET /api/calculator/list?userId=user-123&limit=20
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "calculators": [
 *       {
 *         "id": "calc-123",
 *         "propertyValue": 1000000,
 *         "approvalStatus": {
 *           "approved": true,
 *           "percentagePaid": 35
 *         },
 *         "createdAt": "2025-11-05T10:00:00.000Z"
 *       },
 *       {
 *         "id": "calc-456",
 *         "propertyValue": 750000,
 *         "approvalStatus": {
 *           "approved": false,
 *           "percentagePaid": 22
 *         },
 *         "createdAt": "2025-11-04T15:30:00.000Z"
 *       }
 *     ],
 *     "total": 2
 *   },
 *   "meta": {
 *     "timestamp": "2025-11-05T12:00:00.000Z",
 *     "pagination": {
 *       "page": 1,
 *       "limit": 20,
 *       "total": 2
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
        'list'
      );
    }

    // Parse query parameters from URL
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const limit = url.searchParams.get('limit');

    // Validate query parameters
    const validated = ListCalculatorsQuerySchema.parse({ userId, limit });

    // Find calculators by user ID
    const calculators = await repository.findByUserId(
      validated.userId,
      validated.limit
    );

    // Build response data
    const responseData: ListCalculatorsResponse = {
      calculators: calculators.map((calculator) => {
        const approvalStatus = calculator.getApprovalStatus();
        return {
          id: calculator.getId(),
          propertyValue: calculator.getPropertyValue().getAmount(),
          approvalStatus: {
            approved: approvalStatus.approved,
            percentagePaid: approvalStatus.percentagePaid,
          },
          createdAt: calculator.getCreatedAt().toISOString(),
        };
      }),
      total: calculators.length,
    };

    // Return success response with pagination metadata
    return new Response(
      JSON.stringify(
        createSuccessResponse(responseData, {
          timestamp: new Date().toISOString(),
          pagination: {
            page: 1,
            limit: validated.limit,
            total: calculators.length,
          },
        })
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=30',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '99',
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
    console.error('Unexpected error in GET /api/calculator/list:', error);
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
