import { BaseError } from './BaseError';

/**
 * Payment Gateway Error
 *
 * Thrown when payment gateway integration fails.
 * HTTP Status: 502 Bad Gateway
 */
export class PaymentGatewayError extends BaseError {
  public readonly gateway: string;
  public readonly operation: string;
  public readonly originalError?: Error;

  constructor(message: string, gateway: string, operation: string, originalError?: Error) {
    super(message, 'PAYMENT_GATEWAY_ERROR', 502, true);
    this.gateway = gateway;
    this.operation = operation;
    this.originalError = originalError;
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      gateway: this.gateway,
      operation: this.operation,
      originalError: this.originalError?.message,
    };
  }
}
