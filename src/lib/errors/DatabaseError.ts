import { BaseError } from './BaseError';

/**
 * Database Error
 *
 * Thrown when database operations fail.
 * HTTP Status: 500 Internal Server Error
 */
export class DatabaseError extends BaseError {
  public readonly operation: string;
  public readonly originalError?: Error;

  constructor(message: string, operation: string, originalError?: Error) {
    super(message, 'DATABASE_ERROR', 500, true);
    this.operation = operation;
    this.originalError = originalError;
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      operation: this.operation,
      originalError: this.originalError?.message,
    };
  }
}
