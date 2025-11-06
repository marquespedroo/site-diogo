import { type ICalculatorRepository } from '@/domain/calculator/repositories/ICalculatorRepository';
import { GenerateShortCodeSchema } from '@/lib/validators/calculator.schema';
import {
  createSuccessResponse,
  createErrorResponse,
  type GenerateShareableLinkResponse,
} from '@/api/types/responses';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  UnauthorizedError,
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
 * POST /api/calculator/share
 *
 * Generates a shareable short link for a calculator.
 * Validates request body with calculatorId and userId.
 * Verifies user owns the calculator.
 * Generates short code if not already exists.
 * Updates calculator with short code.
 * Returns shareable URL.
 *
 * @param request - HTTP POST request with calculatorId and userId
 * @returns Response with short URL and code
 *
 * @example
 * POST /api/calculator/share
 * Content-Type: application/json
 *
 * {
 *   "calculatorId": "calc-123",
 *   "userId": "user-123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "shortUrl": "https://example.com/c/abc123",
 *     "shortCode": "abc123",
 *     "expiresAt": null
 *   }
 * }
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Check if repository is injected
    if (!repository) {
      throw new DatabaseError(
        'Repository not initialized',
        'share'
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request with Zod schema
    const validated = GenerateShortCodeSchema.parse(body);

    // Find calculator by ID
    const calculator = await repository.findById(validated.calculatorId);

    if (!calculator) {
      throw new NotFoundError('Calculator', validated.calculatorId);
    }

    // Verify user owns the calculator
    if (calculator.getUserId() !== validated.userId) {
      throw new UnauthorizedError(
        'You do not have permission to share this calculator'
      );
    }

    // Check if short code already exists
    let shortCode = calculator.getShortCode();
    let isNewShortCode = false;

    if (!shortCode) {
      // Generate new short code
      shortCode = calculator.generateShortCode();
      isNewShortCode = true;

      // Ensure short code is unique
      let attempts = 0;
      const maxAttempts = 10;

      while (await repository.shortCodeExists(shortCode)) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new DatabaseError(
            'Failed to generate unique short code after multiple attempts',
            'share'
          );
        }
        shortCode = calculator.generateShortCode();
      }

      // Update calculator with short code
      await repository.update(calculator);
    }

    // Get base URL from request
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    // Build shareable URL
    const shortUrl = calculator.getShareableUrl(baseUrl);

    // Build response data
    const responseData: GenerateShareableLinkResponse = {
      shortUrl,
      shortCode,
      expiresAt: null, // Short links don't expire in this implementation
    };

    // Return success response
    return new Response(
      JSON.stringify(createSuccessResponse(responseData)),
      {
        status: isNewShortCode ? 201 : 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': '49',
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

    // Handle unexpected errors
    console.error('Unexpected error in POST /api/calculator/share:', error);
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
