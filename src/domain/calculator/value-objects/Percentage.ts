/**
 * Percentage Value Object
 *
 * Immutable value object representing percentage values (0-100).
 * Follows Value Object pattern from DDD.
 *
 * @example
 * const rate = new Percentage(30); // 30%
 * const decimal = rate.toDecimal(); // 0.30
 */
export class Percentage {
  private readonly value: number;

  constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    if (!Number.isFinite(value)) {
      throw new Error('Percentage must be a finite number');
    }

    this.value = Math.round(value * 100) / 100; // Round to 2 decimals
  }

  /**
   * Get percentage value (0-100)
   */
  getValue(): number {
    return this.value;
  }

  /**
   * Convert to decimal (0-1)
   */
  toDecimal(): number {
    return this.value / 100;
  }

  /**
   * Format as percentage string
   */
  format(): string {
    return `${this.value.toFixed(2)}%`;
  }

  /**
   * Check if equal to another Percentage
   */
  equals(other: Percentage): boolean {
    return this.value === other.value;
  }

  /**
   * Add two percentages
   */
  add(other: Percentage): Percentage {
    const sum = this.value + other.value;
    if (sum > 100) {
      throw new Error('Sum of percentages cannot exceed 100%');
    }
    return new Percentage(sum);
  }

  /**
   * Subtract two percentages
   */
  subtract(other: Percentage): Percentage {
    const diff = this.value - other.value;
    if (diff < 0) {
      throw new Error('Subtraction would result in negative percentage');
    }
    return new Percentage(diff);
  }

  /**
   * Create Percentage from decimal (0-1)
   */
  static fromDecimal(decimal: number): Percentage {
    if (decimal < 0 || decimal > 1) {
      throw new Error('Decimal must be between 0 and 1');
    }
    return new Percentage(decimal * 100);
  }

  /**
   * Create Percentage from JSON
   */
  static fromJSON(json: { value: number }): Percentage {
    return new Percentage(json.value);
  }

  /**
   * Convert to JSON
   */
  toJSON(): { value: number } {
    return { value: this.value };
  }

  /**
   * Zero percentage
   */
  static zero(): Percentage {
    return new Percentage(0);
  }

  /**
   * One hundred percentage
   */
  static oneHundred(): Percentage {
    return new Percentage(100);
  }
}
