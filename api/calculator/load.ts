import { type ICalculatorRepository } from '@/domain/calculator/repositories/ICalculatorRepository';
import { LoadByShortCodeSchema } from '@/lib/validators/calculator.schema';
import {
  createSuccessResponse,
  createErrorResponse,
  type LoadCalculatorResponse,
} from '@/api/types/responses';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  BaseError,
} from '@/lib/errors';
import { ZodError } from 'zod';

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
 * GET /api/calculator/load?shortCode=abc123
 *
 * Loads a calculator by its short code (for shareable links).
 * Validates short code format.
 * Retrieves calculator from repository.
 * Increments view count for analytics.
 * Returns full calculator data with approval status.
 *
 * @param request - HTTP GET request with shortCode query parameter
 * @returns Response with calculator data
 *
 * @example
 * GET /api/calculator/load?shortCode=abc123
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "calculator": {
 *       "id": "calc-123",
 *       "userId": "user-123",
 *       "propertyValue": 1000000,
 *       "captationPercentage": 30,
 *       "completionDate": { "month": 12, "year": 2026 },
 *       "entryPayments": {...},
 *       "duringConstructionPayments": {...},
 *       "habiteSe": 50000,
 *       "postConstructionPayments": {...},
 *       "shortCode": "abc123",
 *       "viewCount": 15,
 *       "createdAt": "2025-11-05T10:00:00.000Z"
 *     },
 *     "approvalStatus": {
 *       "approved": true,
 *       "requiredCaptation": 300000,
 *       "actualCaptation": 350000,
 *       "difference": 50000,
 *       "percentagePaid": 35
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
        'load'
      );
    }

    // Parse query parameters from URL
    const url = new URL(request.url);
    const shortCode = url.searchParams.get('shortCode');

    // Validate query parameters
    const validated = LoadByShortCodeSchema.parse({ shortCode });

    // Find calculator by short code
    const calculator = await repository.findByShortCode(validated.shortCode);

    if (!calculator) {
      throw new NotFoundError('Calculator', validated.shortCode);
    }

    // Increment view count for analytics
    await repository.incrementViewCount(calculator.getId());
    calculator.incrementViewCount();

    // Get approval status
    const approvalStatus = calculator.getApprovalStatus();

    // Build response data
    const responseData: LoadCalculatorResponse = {
      calculator: {
        id: calculator.getId(),
        userId: calculator.getUserId(),
        propertyValue: calculator.getPropertyValue().getAmount(),
        captationPercentage: calculator.getCaptationPercentage().getValue(),
        completionDate: calculator.getCompletionDate().toJSON(),
        entryPayments: calculator.getEntryPayments().toJSON(),
        duringConstructionPayments: calculator.getDuringConstructionPayments().toJSON(),
        habiteSe: calculator.getHabiteSe().getAmount(),
        postConstructionPayments: calculator.getPostConstructionPayments().toJSON(),
        shortCode: calculator.getShortCode(),
        viewCount: calculator.getViewCount(),
        createdAt: calculator.getCreatedAt().toISOString(),
      },
      approvalStatus: {
        approved: approvalStatus.approved,
        requiredCaptation: approvalStatus.requiredCaptation.getAmount(),
        actualCaptation: approvalStatus.actualCaptation.getAmount(),
        difference: approvalStatus.difference.getAmount(),
        percentagePaid: approvalStatus.percentagePaid,
      },
    };

    // Return success response
    return new Response(
      JSON.stringify(createSuccessResponse(responseData)),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          'X-RateLimit-Limit': '200',
          'X-RateLimit-Remaining': '199',
        },
      }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const validationError = new ValidationError(
        'Invalid short code format',
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
    console.error('Unexpected error in GET /api/calculator/load:', error);
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
