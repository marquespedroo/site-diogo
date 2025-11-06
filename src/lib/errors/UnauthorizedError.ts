import { BaseError } from './BaseError';

/**
 * Unauthorized Error
 *
 * Thrown when authentication is required but missing or invalid.
 * HTTP Status: 401 Unauthorized
 */
export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401, true);
  }
}
