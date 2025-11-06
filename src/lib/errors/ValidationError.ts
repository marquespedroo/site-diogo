import { BaseError } from './BaseError';

/**
 * Validation Error
 *
 * Thrown when input validation fails.
 * HTTP Status: 400 Bad Request
 */
export class ValidationError extends BaseError {
  public readonly details?: Array<{ field: string; message: string }>;

  constructor(message: string, details?: Array<{ field: string; message: string }>) {
    super(message, 'VALIDATION_ERROR', 400, true);
    this.details = details;
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      details: this.details,
    };
  }
}
