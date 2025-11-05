import { ValidationError } from '@/lib/errors';

/**
 * PropertyCharacteristics Value Object
 *
 * Immutable value object representing property characteristics
 * (bedrooms, bathrooms, parking spots, and additional features).
 * Follows Value Object pattern from DDD.
 *
 * @example
 * const characteristics = new PropertyCharacteristics(
 *   3, // bedrooms
 *   2, // bathrooms
 *   2, // parking spots
 *   ['pool', 'gym', 'garden']
 * );
 */
export class PropertyCharacteristics {
  private readonly bedrooms: number;
  private readonly bathrooms: number;
  private readonly parkingSpots: number;
  private readonly additionalFeatures: readonly string[];

  constructor(
    bedrooms: number,
    bathrooms: number,
    parkingSpots: number,
    additionalFeatures: string[] = []
  ) {
    this.bedrooms = bedrooms;
    this.bathrooms = bathrooms;
    this.parkingSpots = parkingSpots;
    this.additionalFeatures = Object.freeze([...additionalFeatures]);

    this.validate();
  }

  /**
   * Validate characteristics
   */
  private validate(): void {
    if (this.bedrooms < 0 || !Number.isInteger(this.bedrooms)) {
      throw new ValidationError('Bedrooms must be a non-negative integer');
    }

    if (this.bathrooms < 0 || !Number.isInteger(this.bathrooms)) {
      throw new ValidationError('Bathrooms must be a non-negative integer');
    }

    if (this.parkingSpots < 0 || !Number.isInteger(this.parkingSpots)) {
      throw new ValidationError('Parking spots must be a non-negative integer');
    }

    // Validate maximum values for reasonableness
    if (this.bedrooms > 50) {
      throw new ValidationError('Bedrooms cannot exceed 50');
    }

    if (this.bathrooms > 50) {
      throw new ValidationError('Bathrooms cannot exceed 50');
    }

    if (this.parkingSpots > 50) {
      throw new ValidationError('Parking spots cannot exceed 50');
    }
  }

  /**
   * Get number of bedrooms
   */
  getBedrooms(): number {
    return this.bedrooms;
  }

  /**
   * Get number of bathrooms
   */
  getBathrooms(): number {
    return this.bathrooms;
  }

  /**
   * Get number of parking spots
   */
  getParkingSpots(): number {
    return this.parkingSpots;
  }

  /**
   * Get additional features (immutable copy)
   */
  getFeatures(): ReadonlyArray<string> {
    return this.additionalFeatures;
  }

  /**
   * Check if has a specific feature
   */
  hasFeature(feature: string): boolean {
    return this.additionalFeatures.includes(feature.toLowerCase());
  }

  /**
   * Get total room count (bedrooms + bathrooms)
   */
  getTotalRooms(): number {
    return this.bedrooms + this.bathrooms;
  }

  /**
   * Format characteristics as string
   */
  toString(): string {
    let description = `${this.bedrooms} quarto${this.bedrooms !== 1 ? 's' : ''}`;
    description += `, ${this.bathrooms} banheiro${this.bathrooms !== 1 ? 's' : ''}`;
    description += `, ${this.parkingSpots} vaga${this.parkingSpots !== 1 ? 's' : ''}`;

    if (this.additionalFeatures.length > 0) {
      description += ` (${this.additionalFeatures.join(', ')})`;
    }

    return description;
  }

  /**
   * Check if equal to another PropertyCharacteristics
   */
  equals(other: PropertyCharacteristics): boolean {
    if (
      this.bedrooms !== other.bedrooms ||
      this.bathrooms !== other.bathrooms ||
      this.parkingSpots !== other.parkingSpots
    ) {
      return false;
    }

    // Check features
    if (this.additionalFeatures.length !== other.additionalFeatures.length) {
      return false;
    }

    const sortedThis = [...this.additionalFeatures].sort();
    const sortedOther = [...other.additionalFeatures].sort();

    return sortedThis.every((feature, index) => feature === sortedOther[index]);
  }

  /**
   * Create PropertyCharacteristics from JSON
   */
  static fromJSON(json: {
    bedrooms: number;
    bathrooms: number;
    parkingSpots: number;
    additionalFeatures?: string[];
  }): PropertyCharacteristics {
    return new PropertyCharacteristics(
      json.bedrooms,
      json.bathrooms,
      json.parkingSpots,
      json.additionalFeatures || []
    );
  }

  /**
   * Convert to JSON
   */
  toJSON(): {
    bedrooms: number;
    bathrooms: number;
    parkingSpots: number;
    additionalFeatures: string[];
  } {
    return {
      bedrooms: this.bedrooms,
      bathrooms: this.bathrooms,
      parkingSpots: this.parkingSpots,
      additionalFeatures: [...this.additionalFeatures],
    };
  }
}
