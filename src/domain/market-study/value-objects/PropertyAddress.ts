import { ValidationError } from '@/lib/errors';

/**
 * PropertyAddress Value Object
 *
 * Immutable value object representing a property address.
 * Follows Value Object pattern from DDD.
 *
 * @example
 * const address = new PropertyAddress(
 *   'Rua das Flores',
 *   '123',
 *   'Centro',
 *   'São Paulo',
 *   'SP'
 * );
 * console.log(address.toString()); // "Rua das Flores, 123, Centro, São Paulo-SP"
 */
export class PropertyAddress {
  private readonly street: string;
  private readonly number: string;
  private readonly neighborhood: string;
  private readonly city: string;
  private readonly state: string;
  private readonly complement?: string;
  private readonly postalCode?: string;

  constructor(
    street: string,
    number: string,
    neighborhood: string,
    city: string,
    state: string,
    complement?: string,
    postalCode?: string
  ) {
    this.street = street;
    this.number = number;
    this.neighborhood = neighborhood;
    this.city = city;
    this.state = state;
    this.complement = complement;
    this.postalCode = postalCode;

    this.validate();
  }

  /**
   * Validate address components
   */
  private validate(): void {
    if (!this.street || this.street.trim().length === 0) {
      throw new ValidationError('Street is required');
    }

    if (!this.neighborhood || this.neighborhood.trim().length === 0) {
      throw new ValidationError('Neighborhood is required');
    }

    if (!this.city || this.city.trim().length === 0) {
      throw new ValidationError('City is required');
    }

    if (!this.state || this.state.trim().length === 0) {
      throw new ValidationError('State is required');
    }

    // Validate state format (2 letters)
    if (this.state.length !== 2) {
      throw new ValidationError('State must be a 2-letter code (e.g., SP, RJ)');
    }

    // Validate postal code format if provided
    if (this.postalCode && !/^\d{5}-?\d{3}$/.test(this.postalCode)) {
      throw new ValidationError('Postal code must be in format XXXXX-XXX');
    }
  }

  /**
   * Get street name
   */
  getStreet(): string {
    return this.street;
  }

  /**
   * Get street number
   */
  getNumber(): string {
    return this.number;
  }

  /**
   * Get neighborhood
   */
  getNeighborhood(): string {
    return this.neighborhood;
  }

  /**
   * Get city
   */
  getCity(): string {
    return this.city;
  }

  /**
   * Get state
   */
  getState(): string {
    return this.state;
  }

  /**
   * Get complement (optional)
   */
  getComplement(): string | undefined {
    return this.complement;
  }

  /**
   * Get postal code (optional)
   */
  getPostalCode(): string | undefined {
    return this.postalCode;
  }

  /**
   * Format address as string
   */
  toString(): string {
    let address = `${this.street}, ${this.number}`;

    if (this.complement) {
      address += `, ${this.complement}`;
    }

    address += `, ${this.neighborhood}, ${this.city}-${this.state}`;

    if (this.postalCode) {
      address += ` - CEP: ${this.postalCode}`;
    }

    return address;
  }

  /**
   * Check if equal to another PropertyAddress
   */
  equals(other: PropertyAddress): boolean {
    return (
      this.street === other.street &&
      this.number === other.number &&
      this.neighborhood === other.neighborhood &&
      this.city === other.city &&
      this.state === other.state &&
      this.complement === other.complement &&
      this.postalCode === other.postalCode
    );
  }

  /**
   * Create PropertyAddress from JSON
   */
  static fromJSON(json: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement?: string;
    postalCode?: string;
  }): PropertyAddress {
    return new PropertyAddress(
      json.street,
      json.number,
      json.neighborhood,
      json.city,
      json.state,
      json.complement,
      json.postalCode
    );
  }

  /**
   * Convert to JSON
   */
  toJSON(): {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement?: string;
    postalCode?: string;
  } {
    return {
      street: this.street,
      number: this.number,
      neighborhood: this.neighborhood,
      city: this.city,
      state: this.state,
      complement: this.complement,
      postalCode: this.postalCode,
    };
  }
}
