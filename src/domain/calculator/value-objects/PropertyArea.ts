/**
 * PropertyArea Value Object
 *
 * Immutable value object representing property area in square meters.
 * Follows Value Object pattern from DDD.
 *
 * @example
 * const area = new PropertyArea(150.5);
 * const sqm = area.getSquareMeters(); // 150.5
 */
export class PropertyArea {
  private readonly squareMeters: number;

  constructor(squareMeters: number) {
    if (squareMeters <= 0) {
      throw new Error('Property area must be positive');
    }
    if (!Number.isFinite(squareMeters)) {
      throw new Error('Property area must be a finite number');
    }
    if (squareMeters > 100000) {
      throw new Error('Property area cannot exceed 100,000 m²');
    }

    // Round to 2 decimal places
    this.squareMeters = Math.round(squareMeters * 100) / 100;
  }

  /**
   * Get area in square meters
   */
  getSquareMeters(): number {
    return this.squareMeters;
  }

  /**
   * Format as string with unit
   */
  format(): string {
    return `${this.squareMeters.toFixed(2)} m²`;
  }

  /**
   * Check if equal to another PropertyArea
   */
  equals(other: PropertyArea): boolean {
    return this.squareMeters === other.squareMeters;
  }

  /**
   * Check if greater than another PropertyArea
   */
  greaterThan(other: PropertyArea): boolean {
    return this.squareMeters > other.squareMeters;
  }

  /**
   * Check if less than another PropertyArea
   */
  lessThan(other: PropertyArea): boolean {
    return this.squareMeters < other.squareMeters;
  }

  /**
   * Create PropertyArea from JSON
   */
  static fromJSON(json: { squareMeters: number } | number): PropertyArea {
    if (typeof json === 'number') {
      return new PropertyArea(json);
    }
    return new PropertyArea(json.squareMeters);
  }

  /**
   * Convert to JSON
   */
  toJSON(): { squareMeters: number } {
    return {
      squareMeters: this.squareMeters,
    };
  }
}
