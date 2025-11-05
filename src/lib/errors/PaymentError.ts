import { BaseError } from './BaseError';

/**
 * Payment Error
 *
 * Thrown when payment processing fails.
 * HTTP Status: 402 Payment Required
 */
export class PaymentError extends BaseError {
  public readonly transactionId?: string;
  public readonly gatewayCode?: string;

  constructor(
    message: string,
    transactionId?: string,
    gatewayCode?: string
  ) {
    super(message, 'PAYMENT_ERROR', 402, true);
    this.transactionId = transactionId;
    this.gatewayCode = gatewayCode;
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      transactionId: this.transactionId,
      gatewayCode: this.gatewayCode,
    };
  }
}
