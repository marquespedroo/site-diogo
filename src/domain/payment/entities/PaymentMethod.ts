/**
 * Payment Method Type
 */
export type PaymentMethodType = 'credit_card' | 'pix' | 'boleto';

/**
 * Credit Card Details
 */
export interface CreditCardDetails {
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  holderName?: string;
}

/**
 * PIX Payment Details
 */
export interface PixDetails {
  qrCode: string;
  qrCodeUrl: string;
  expiresAt: Date;
}

/**
 * Boleto Payment Details
 */
export interface BoletoDetails {
  barcodeNumber: string;
  barcodeUrl: string;
  pdfUrl: string;
  expiresAt: Date;
}

/**
 * Payment Method Details Union Type
 */
export type PaymentMethodDetails = {
  creditCard?: CreditCardDetails;
  pix?: PixDetails;
  boleto?: BoletoDetails;
};

/**
 * PaymentMethod Entity
 *
 * Represents a payment method used for transactions.
 * Can be credit card, PIX, or Boleto.
 *
 * @example
 * const method = new PaymentMethod(
 *   'pm_123',
 *   'credit_card',
 *   { creditCard: { brand: 'visa', last4: '4242', expiryMonth: 12, expiryYear: 2025 } }
 * );
 */
export class PaymentMethod {
  private readonly id: string;
  private readonly type: PaymentMethodType;
  private readonly details: PaymentMethodDetails;
  private readonly createdAt: Date;

  constructor(
    id: string,
    type: PaymentMethodType,
    details: PaymentMethodDetails,
    createdAt?: Date
  ) {
    this.id = id;
    this.type = type;
    this.details = details;
    this.createdAt = createdAt || new Date();

    this.validate();
  }

  /**
   * Validate payment method data
   */
  private validate(): void {
    // Validate that details match type
    if (this.type === 'credit_card' && !this.details.creditCard) {
      throw new Error('Credit card details required for credit_card type');
    }
    if (this.type === 'pix' && !this.details.pix) {
      throw new Error('PIX details required for pix type');
    }
    if (this.type === 'boleto' && !this.details.boleto) {
      throw new Error('Boleto details required for boleto type');
    }
  }

  /**
   * Get payment method ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get payment method type
   */
  getType(): PaymentMethodType {
    return this.type;
  }

  /**
   * Get payment method details
   */
  getDetails(): PaymentMethodDetails {
    return this.details;
  }

  /**
   * Get creation timestamp
   */
  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  /**
   * Check if payment method is credit card
   */
  isCreditCard(): boolean {
    return this.type === 'credit_card';
  }

  /**
   * Check if payment method is PIX
   */
  isPix(): boolean {
    return this.type === 'pix';
  }

  /**
   * Check if payment method is Boleto
   */
  isBoleto(): boolean {
    return this.type === 'boleto';
  }

  /**
   * Get human-readable description
   */
  getDescription(): string {
    switch (this.type) {
      case 'credit_card':
        const cc = this.details.creditCard!;
        return `${cc.brand.toUpperCase()} •••• ${cc.last4}`;
      case 'pix':
        return 'PIX';
      case 'boleto':
        return 'Boleto Bancário';
      default:
        return 'Unknown';
    }
  }

  /**
   * Convert to JSON
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      details: this.details,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * Create PaymentMethod from JSON
   */
  static fromJSON(json: Record<string, any>): PaymentMethod {
    const details: PaymentMethodDetails = {};

    if (json.details.creditCard) {
      details.creditCard = json.details.creditCard;
    }
    if (json.details.pix) {
      details.pix = {
        ...json.details.pix,
        expiresAt: new Date(json.details.pix.expiresAt),
      };
    }
    if (json.details.boleto) {
      details.boleto = {
        ...json.details.boleto,
        expiresAt: new Date(json.details.boleto.expiresAt),
      };
    }

    return new PaymentMethod(json.id, json.type, details, new Date(json.createdAt));
  }
}
