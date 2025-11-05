import { type ICalculatorRepository } from '@/domain/calculator/repositories/ICalculatorRepository';
import {
  PaymentCalculator,
  Money,
  Percentage,
  CompletionDate,
  PaymentPhase,
} from '@/domain/calculator';
import { CreateCalculatorSchema } from '@/lib/validators/calculator.schema';
import {
  createSuccessResponse,
  createErrorResponse,
  type CreateCalculatorResponse,
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
 * POST /api/calculator/create
 *
 * Creates a new payment calculator with validation and persistence.
 * Validates request body against CreateCalculatorSchema.
 * Constructs domain entity from request data.
 * Persists calculator via repository.
 * Returns calculator ID and approval status.
 *
 * @param request - HTTP POST request with calculator data in body
 * @returns Response with calculator ID and approval status
 *
 * @example
 * POST /api/calculator/create
 * Content-Type: application/json
 *
 * {
 *   "userId": "user-123",
 *   "propertyValue": 1000000,
 *   "captationPercentage": 30,
 *   "completionDate": { "month": 12, "year": 2026 },
 *   "entryPayments": { "name": "Entry", "installments": [...] },
 *   "duringConstructionPayments": { "name": "During", "installments": [...] },
 *   "habiteSe": 50000,
 *   "postConstructionPayments": { "name": "Post", "installments": [...] }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "abc123",
 *     "approvalStatus": {
 *       "approved": true,
 *       "requiredCaptation": 300000,
 *       "actualCaptation": 350000,
 *       "difference": 50000,
 *       "percentagePaid": 35
 *     },
 *     "createdAt": "2025-11-05T10:00:00.000Z"
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
    const validated = CreateCalculatorSchema.parse(body);

    // Construct domain value objects from validated data
    const propertyValue = new Money(validated.propertyValue);
    const captationPercentage = new Percentage(validated.captationPercentage);
    const completionDate = new CompletionDate(
      validated.completionDate.month,
      validated.completionDate.year
    );
    const entryPayments = PaymentPhase.fromJSON(validated.entryPayments);
    const duringConstructionPayments = PaymentPhase.fromJSON(
      validated.duringConstructionPayments
    );
    const habiteSe = new Money(validated.habiteSe);
    const postConstructionPayments = PaymentPhase.fromJSON(
      validated.postConstructionPayments
    );

    // Create PaymentCalculator aggregate root
    const calculator = new PaymentCalculator({
      userId: validated.userId,
      propertyValue,
      captationPercentage,
      completionDate,
      entryPayments,
      duringConstructionPayments,
      habiteSe,
      postConstructionPayments,
    });

    // Persist via repository
    const savedCalculator = await repository.save(calculator);

    // Get approval status
    const approvalStatus = savedCalculator.getApprovalStatus();

    // Build response data
    const responseData: CreateCalculatorResponse = {
      id: savedCalculator.getId(),
      approvalStatus: {
        approved: approvalStatus.approved,
        requiredCaptation: approvalStatus.requiredCaptation.getAmount(),
        actualCaptation: approvalStatus.actualCaptation.getAmount(),
        difference: approvalStatus.difference.getAmount(),
        percentagePaid: approvalStatus.percentagePaid,
      },
      createdAt: savedCalculator.getCreatedAt().toISOString(),
    };

    // Return success response
    return new Response(
      JSON.stringify(createSuccessResponse(responseData)),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '99',
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
    console.error('Unexpected error in POST /api/calculator/create:', error);
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
