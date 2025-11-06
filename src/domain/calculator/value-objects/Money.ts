/**
 * Money Value Object
 *
 * Immutable value object representing monetary values in Brazilian Real (BRL).
 * Follows Value Object pattern from DDD.
 *
 * @example
 * const price = new Money(150000);
 * const discount = new Money(10000);
 * const total = price.subtract(discount); // Money(140000)
 */
export class Money {
  private readonly amount: number;
  private readonly currency: string;

  constructor(amount: number, currency: string = 'BRL') {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    if (!Number.isFinite(amount)) {
      throw new Error('Money amount must be a finite number');
    }

    // Store as cents to avoid floating point issues
    this.amount = Math.round(amount * 100) / 100;
    this.currency = currency;
  }

  /**
   * Add two Money objects
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  /**
   * Subtract two Money objects
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Subtraction would result in negative amount');
    }
    return new Money(result, this.currency);
  }

  /**
   * Multiply by a factor
   */
  multiply(factor: number): Money {
    if (!Number.isFinite(factor)) {
      throw new Error('Multiplication factor must be finite');
    }
    return new Money(this.amount * factor, this.currency);
  }

  /**
   * Divide by a divisor
   */
  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    if (!Number.isFinite(divisor)) {
      throw new Error('Divisor must be finite');
    }
    return new Money(this.amount / divisor, this.currency);
  }

  /**
   * Get raw amount
   */
  getAmount(): number {
    return this.amount;
  }

  /**
   * Get currency code
   */
  getCurrency(): string {
    return this.currency;
  }

  /**
   * Format as Brazilian currency string
   */
  format(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.amount);
  }

  /**
   * Check if equal to another Money object
   */
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  /**
   * Check if greater than another Money object
   */
  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  /**
   * Check if less than another Money object
   */
  lessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  /**
   * Check if greater than or equal to another Money object
   */
  greaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount >= other.amount;
  }

  /**
   * Check if less than or equal to another Money object
   */
  lessThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount <= other.amount;
  }

  /**
   * Assert that two Money objects have the same currency
   */
  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} !== ${other.currency}`);
    }
  }

  /**
   * Create Money from JSON
   */
  static fromJSON(json: { amount: number; currency?: string }): Money {
    return new Money(json.amount, json.currency);
  }

  /**
   * Convert to JSON
   */
  toJSON(): { amount: number; currency: string } {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }

  /**
   * Zero money value
   */
  static zero(currency: string = 'BRL'): Money {
    return new Money(0, currency);
  }
}
