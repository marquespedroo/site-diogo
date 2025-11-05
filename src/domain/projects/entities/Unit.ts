import { Money } from '../../calculator/value-objects/Money';
import { PropertyArea } from '../../calculator/value-objects/PropertyArea';
import { UnitIdentifier } from '../value-objects/UnitIdentifier';

/**
 * Unit Status Type
 */
export type UnitStatus = 'available' | 'reserved' | 'sold' | 'unavailable';

/**
 * Unit Origin Type
 */
export type UnitOrigin = 'real' | 'permutante';

/**
 * Unit Params Interface
 */
export interface UnitParams {
  id?: string;
  projectId: string;
  identifier: UnitIdentifier;
  area: PropertyArea;
  price: Money;
  parkingSpots: string;
  origin: UnitOrigin;
  status?: UnitStatus;
  metadata?: Map<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Unit Entity
 *
 * Entity representing a real estate unit within a project.
 * Contains business logic for status management and calculations.
 * Follows Entity pattern from DDD.
 *
 * @example
 * const unit = new Unit({
 *   projectId: 'proj-123',
 *   identifier: new UnitIdentifier('A', '101'),
 *   area: new PropertyArea(150),
 *   price: new Money(500000),
 *   parkingSpots: '2',
 *   origin: 'real',
 * });
 *
 * unit.markAsSold(new Date(), new Money(480000));
 * console.log(unit.getStatus()); // "sold"
 */
export class Unit {
  private readonly id: string;
  private readonly projectId: string;
  private readonly identifier: UnitIdentifier;
  private readonly area: PropertyArea;
  private readonly price: Money;
  private readonly parkingSpots: string;
  private readonly origin: UnitOrigin;
  private status: UnitStatus;
  private readonly metadata: Map<string, any>;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(params: UnitParams) {
    // Generate ID if not provided
    this.id = params.id || this.generateId();
    this.projectId = params.projectId;
    this.identifier = params.identifier;
    this.area = params.area;
    this.price = params.price;
    this.parkingSpots = params.parkingSpots;
    this.origin = params.origin;
    this.status = params.status || 'available';
    this.metadata = params.metadata || new Map();
    this.createdAt = params.createdAt || new Date();
    this.updatedAt = params.updatedAt || new Date();

    // Validate
    this.validate();
  }

  /**
   * Validate business rules
   */
  private validate(): void {
    if (!this.projectId || this.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }
  }

  // ============================================================================
  // Status Management
  // ============================================================================

  /**
   * Mark unit as sold
   *
   * @param soldDate - Date when unit was sold
   * @param soldPrice - Final sold price (optional)
   */
  markAsSold(soldDate: Date, soldPrice?: Money): void {
    this.status = 'sold';
    this.metadata.set('soldDate', soldDate);
    if (soldPrice) {
      this.metadata.set('soldPrice', soldPrice);
    }
    this.updatedAt = new Date();
  }

  /**
   * Mark unit as reserved
   *
   * @param reservedBy - User ID or name who reserved
   * @param reservedUntil - Reservation expiration date
   */
  markAsReserved(reservedBy: string, reservedUntil: Date): void {
    this.status = 'reserved';
    this.metadata.set('reservedBy', reservedBy);
    this.metadata.set('reservedUntil', reservedUntil);
    this.updatedAt = new Date();
  }

  /**
   * Mark unit as available
   */
  markAsAvailable(): void {
    this.status = 'available';
    this.metadata.delete('soldDate');
    this.metadata.delete('soldPrice');
    this.metadata.delete('reservedBy');
    this.metadata.delete('reservedUntil');
    this.updatedAt = new Date();
  }

  /**
   * Mark unit as unavailable (e.g., under maintenance)
   */
  markAsUnavailable(): void {
    this.status = 'unavailable';
    this.updatedAt = new Date();
  }

  /**
   * Check if reservation has expired
   */
  isReservationExpired(): boolean {
    if (this.status !== 'reserved') {
      return false;
    }

    const reservedUntil = this.metadata.get('reservedUntil');
    if (!reservedUntil || !(reservedUntil instanceof Date)) {
      return true; // Invalid reservation data
    }

    return reservedUntil < new Date();
  }

  // ============================================================================
  // Calculations
  // ============================================================================

  /**
   * Get price per square meter
   */
  getPricePerSqM(): Money {
    const sqm = this.area.getSquareMeters();
    return new Money(this.price.getAmount() / sqm);
  }

  /**
   * Calculate discount percentage compared to original price
   */
  getDiscountPercentage(): number {
    if (this.status !== 'sold') {
      return 0;
    }

    const soldPrice = this.metadata.get('soldPrice') as Money | undefined;
    if (!soldPrice) {
      return 0;
    }

    const discount = this.price.subtract(soldPrice);
    return (discount.getAmount() / this.price.getAmount()) * 100;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  getId(): string {
    return this.id;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getIdentifier(): UnitIdentifier {
    return this.identifier;
  }

  getArea(): PropertyArea {
    return this.area;
  }

  getPrice(): Money {
    return this.price;
  }

  getParkingSpots(): string {
    return this.parkingSpots;
  }

  getOrigin(): UnitOrigin {
    return this.origin;
  }

  getStatus(): UnitStatus {
    return this.status;
  }

  getMetadata(): ReadonlyMap<string, any> {
    return new Map(this.metadata);
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Convert to JSON for persistence/API
   */
  toJSON(): Record<string, any> {
    // Convert metadata Map to plain object
    const metadataObj: Record<string, any> = {};
    this.metadata.forEach((value, key) => {
      if (value instanceof Date) {
        metadataObj[key] = value.toISOString();
      } else if (value instanceof Money) {
        metadataObj[key] = value.toJSON();
      } else {
        metadataObj[key] = value;
      }
    });

    return {
      id: this.id,
      projectId: this.projectId,
      identifier: this.identifier.toJSON(),
      area: this.area.getSquareMeters(),
      price: this.price.getAmount(),
      parkingSpots: this.parkingSpots,
      origin: this.origin,
      status: this.status,
      metadata: metadataObj,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Create Unit from JSON
   */
  static fromJSON(json: Record<string, any>): Unit {
    // Convert metadata object to Map
    const metadataMap = new Map<string, any>();
    if (json.metadata && typeof json.metadata === 'object') {
      Object.entries(json.metadata).forEach(([key, value]) => {
        // Reconstruct Money objects
        if (
          value &&
          typeof value === 'object' &&
          'amount' in value &&
          'currency' in value
        ) {
          metadataMap.set(key, Money.fromJSON(value as any));
        }
        // Reconstruct Date objects
        else if (
          typeof value === 'string' &&
          /^\d{4}-\d{2}-\d{2}T/.test(value)
        ) {
          metadataMap.set(key, new Date(value));
        }
        // Keep other values as-is
        else {
          metadataMap.set(key, value);
        }
      });
    }

    return new Unit({
      id: json.id,
      projectId: json.projectId,
      identifier: UnitIdentifier.fromJSON(json.identifier),
      area: new PropertyArea(json.area),
      price: new Money(json.price),
      parkingSpots: json.parkingSpots,
      origin: json.origin,
      status: json.status,
      metadata: metadataMap,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
    });
  }

  /**
   * Generate unique ID (timestamp-based)
   */
  private generateId(): string {
    return (
      Date.now().toString(36) + Math.random().toString(36).substring(2, 15)
    );
  }
}
