import { Money } from '@/domain/calculator/value-objects/Money';
import { PropertyArea } from '../value-objects/PropertyArea';
import { ValidationError } from '@/lib/errors';

/**
 * Property Standard Type
 *
 * Represents different property finish/renovation standards.
 * Each standard has a different multiplier on the base valuation.
 */
export type PropertyStandard =
  | 'original' // Original condition, no renovations (0.9x)
  | 'basic' // Basic renovations (0.95x)
  | 'renovated' // Fully renovated (1.0x - baseline)
  | 'modernized' // Modern finishes and upgrades (1.05x)
  | 'high_end'; // High-end luxury finishes (1.1x)

/**
 * Property Valuation Entity
 *
 * Represents a property valuation for a specific standard/condition.
 * Contains price per m² and total value.
 *
 * @example
 * const valuation = new PropertyValuation(
 *   'renovated',
 *   new Money(5000), // price per m²
 *   new Money(450000) // total value
 * );
 */
export class PropertyValuation {
  private readonly standardType: PropertyStandard;
  private readonly pricePerSqM: Money;
  private readonly totalValue: Money;

  constructor(standardType: PropertyStandard, pricePerSqM: Money, totalValue: Money) {
    this.standardType = standardType;
    this.pricePerSqM = pricePerSqM;
    this.totalValue = totalValue;

    this.validate();
  }

  /**
   * Validate valuation
   */
  private validate(): void {
    const validStandards: PropertyStandard[] = [
      'original',
      'basic',
      'renovated',
      'modernized',
      'high_end',
    ];

    if (!validStandards.includes(this.standardType)) {
      throw new ValidationError(`Invalid property standard: ${this.standardType}`);
    }
  }

  /**
   * Get standard type
   */
  getStandardType(): PropertyStandard {
    return this.standardType;
  }

  /**
   * Get price per square meter
   */
  getPricePerSqM(): Money {
    return this.pricePerSqM;
  }

  /**
   * Get total property value
   */
  getTotalValue(): Money {
    return this.totalValue;
  }

  /**
   * Get standard description in Portuguese
   */
  getStandardDescription(): string {
    const descriptions: Record<PropertyStandard, string> = {
      original: 'Original (Sem Reformas)',
      basic: 'Básico (Reformas Básicas)',
      renovated: 'Reformado (Completamente Renovado)',
      modernized: 'Modernizado (Acabamentos Modernos)',
      high_end: 'Alto Padrão (Acabamentos de Luxo)',
    };

    return descriptions[this.standardType];
  }

  /**
   * Get standard multiplier relative to baseline (renovated = 1.0)
   */
  getStandardMultiplier(): number {
    const multipliers: Record<PropertyStandard, number> = {
      original: 0.9,
      basic: 0.95,
      renovated: 1.0,
      modernized: 1.05,
      high_end: 1.1,
    };

    return multipliers[this.standardType];
  }

  /**
   * Calculate valuation for different area
   *
   * Useful for "what-if" scenarios with different property sizes.
   */
  calculateForArea(area: PropertyArea): Money {
    return this.pricePerSqM.multiply(area.getSquareMeters());
  }

  /**
   * Compare with another valuation
   *
   * Returns the difference in total value.
   */
  compareWith(other: PropertyValuation): Money {
    if (this.totalValue.greaterThan(other.totalValue)) {
      return this.totalValue.subtract(other.totalValue);
    } else {
      return other.totalValue.subtract(this.totalValue);
    }
  }

  /**
   * Get percentage difference from another valuation
   */
  getPercentageDifferenceFrom(other: PropertyValuation): number {
    const diff = this.compareWith(other);
    const percentage = (diff.getAmount() / other.totalValue.getAmount()) * 100;
    return Math.round(percentage * 100) / 100; // Round to 2 decimals
  }

  /**
   * Create PropertyValuation from JSON
   */
  static fromJSON(json: {
    standardType: PropertyStandard;
    pricePerSqM: number;
    totalValue: number;
  }): PropertyValuation {
    return new PropertyValuation(
      json.standardType,
      new Money(json.pricePerSqM),
      new Money(json.totalValue)
    );
  }

  /**
   * Convert to JSON
   */
  toJSON(): {
    standardType: PropertyStandard;
    standardDescription: string;
    standardMultiplier: number;
    pricePerSqM: number;
    pricePerSqMFormatted: string;
    totalValue: number;
    totalValueFormatted: string;
  } {
    return {
      standardType: this.standardType,
      standardDescription: this.getStandardDescription(),
      standardMultiplier: this.getStandardMultiplier(),
      pricePerSqM: this.pricePerSqM.getAmount(),
      pricePerSqMFormatted: this.pricePerSqM.format(),
      totalValue: this.totalValue.getAmount(),
      totalValueFormatted: this.totalValue.format(),
    };
  }

  /**
   * Get all standard types
   */
  static getAllStandards(): PropertyStandard[] {
    return ['original', 'basic', 'renovated', 'modernized', 'high_end'];
  }
}
