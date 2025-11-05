import { Money } from '@/domain/calculator/value-objects/Money';
import { PropertyArea } from '../value-objects/PropertyArea';
import { ValidationError } from '@/lib/errors';

/**
 * Market Sample Status
 */
export type MarketSampleStatus = 'for_sale' | 'sold' | 'rented';

/**
 * Market Sample Entity
 *
 * Represents a comparable property sample used for market valuation.
 * Contains original price and homogenized value after adjustments.
 *
 * @example
 * const sample = new MarketSample(
 *   'sample-1',
 *   'Rua das Flores, 100',
 *   new PropertyArea(90),
 *   new Money(450000),
 *   'for_sale',
 *   new Map([['bedrooms', 3], ['bathrooms', 2]]),
 *   new Money(460000) // homogenized value
 * );
 */
export class MarketSample {
  private readonly id: string;
  private readonly location: string;
  private readonly area: PropertyArea;
  private readonly price: Money;
  private readonly status: MarketSampleStatus;
  private readonly characteristics: ReadonlyMap<string, number>;
  private readonly homogenizedValue: Money;
  private readonly listingDate?: Date;
  private readonly saleDate?: Date;

  constructor(
    id: string,
    location: string,
    area: PropertyArea,
    price: Money,
    status: MarketSampleStatus,
    characteristics: Map<string, number>,
    homogenizedValue: Money,
    listingDate?: Date,
    saleDate?: Date
  ) {
    this.id = id;
    this.location = location;
    this.area = area;
    this.price = price;
    this.status = status;
    this.characteristics = new Map(characteristics);
    this.homogenizedValue = homogenizedValue;
    this.listingDate = listingDate;
    this.saleDate = saleDate;

    this.validate();
  }

  /**
   * Validate market sample
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new ValidationError('Market sample ID is required');
    }

    if (!this.location || this.location.trim().length === 0) {
      throw new ValidationError('Location is required');
    }

    // Validate status-specific rules
    if (this.status === 'sold' && !this.saleDate) {
      throw new ValidationError('Sale date is required for sold properties');
    }
  }

  /**
   * Get sample ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get location description
   */
  getLocation(): string {
    return this.location;
  }

  /**
   * Get property area
   */
  getArea(): PropertyArea {
    return this.area;
  }

  /**
   * Get original price
   */
  getPrice(): Money {
    return this.price;
  }

  /**
   * Get listing status
   */
  getStatus(): MarketSampleStatus {
    return this.status;
  }

  /**
   * Get characteristics map (immutable)
   */
  getCharacteristics(): ReadonlyMap<string, number> {
    return this.characteristics;
  }

  /**
   * Get homogenized value (after adjustments)
   */
  getHomogenizedValue(): Money {
    return this.homogenizedValue;
  }

  /**
   * Get listing date
   */
  getListingDate(): Date | undefined {
    return this.listingDate ? new Date(this.listingDate) : undefined;
  }

  /**
   * Get sale date
   */
  getSaleDate(): Date | undefined {
    return this.saleDate ? new Date(this.saleDate) : undefined;
  }

  /**
   * Calculate price per square meter (original)
   */
  getPricePerSqM(): Money {
    return this.price.divide(this.area.getSquareMeters());
  }

  /**
   * Calculate homogenized price per square meter
   */
  getHomogenizedPricePerSqM(): Money {
    return this.homogenizedValue.divide(this.area.getSquareMeters());
  }

  /**
   * Get characteristic value by name
   */
  getCharacteristic(name: string): number | undefined {
    return this.characteristics.get(name);
  }

  /**
   * Check if sample has a specific characteristic
   */
  hasCharacteristic(name: string): boolean {
    return this.characteristics.has(name);
  }

  /**
   * Create MarketSample from JSON
   */
  static fromJSON(json: {
    id: string;
    location: string;
    area: number;
    price: number;
    status: MarketSampleStatus;
    characteristics: Record<string, number>;
    homogenizedValue: number;
    listingDate?: string;
    saleDate?: string;
  }): MarketSample {
    return new MarketSample(
      json.id,
      json.location,
      new PropertyArea(json.area),
      new Money(json.price),
      json.status,
      new Map(Object.entries(json.characteristics)),
      new Money(json.homogenizedValue),
      json.listingDate ? new Date(json.listingDate) : undefined,
      json.saleDate ? new Date(json.saleDate) : undefined
    );
  }

  /**
   * Convert to JSON
   */
  toJSON(): {
    id: string;
    location: string;
    area: number;
    price: number;
    status: MarketSampleStatus;
    characteristics: Record<string, number>;
    homogenizedValue: number;
    pricePerSqM: number;
    homogenizedPricePerSqM: number;
    listingDate?: string;
    saleDate?: string;
  } {
    return {
      id: this.id,
      location: this.location,
      area: this.area.getSquareMeters(),
      price: this.price.getAmount(),
      status: this.status,
      characteristics: Object.fromEntries(this.characteristics),
      homogenizedValue: this.homogenizedValue.getAmount(),
      pricePerSqM: this.getPricePerSqM().getAmount(),
      homogenizedPricePerSqM: this.getHomogenizedPricePerSqM().getAmount(),
      listingDate: this.listingDate?.toISOString(),
      saleDate: this.saleDate?.toISOString(),
    };
  }
}
