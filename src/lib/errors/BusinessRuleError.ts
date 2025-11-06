import { BaseError } from './BaseError';

/**
 * Business Rule Error
 *
 * Thrown when a business rule is violated.
 * HTTP Status: 422 Unprocessable Entity
 */
export class BusinessRuleError extends BaseError {
  public readonly rule: string;

  constructor(message: string, rule?: string) {
    super(message, 'BUSINESS_RULE_VIOLATION', 422, true);
    this.rule = rule || 'unknown';
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      rule: this.rule,
    };
  }
}
