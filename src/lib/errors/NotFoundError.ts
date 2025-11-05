import { BaseError } from './BaseError';

/**
 * Not Found Error
 *
 * Thrown when a requested resource is not found.
 * HTTP Status: 404 Not Found
 */
export class NotFoundError extends BaseError {
  public readonly resource: string;
  public readonly identifier?: string;

  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with ID '${identifier}' not found`
      : `${resource} not found`;

    super(message, 'NOT_FOUND', 404, true);
    this.resource = resource;
    this.identifier = identifier;
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      resource: this.resource,
      identifier: this.identifier,
    };
  }
}
