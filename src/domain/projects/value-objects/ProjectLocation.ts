/**
 * ProjectLocation Value Object
 *
 * Immutable value object representing a project's geographical location.
 * Follows Value Object pattern from DDD.
 *
 * @example
 * const location = new ProjectLocation('São Paulo', 'Vila Mariana', 'SP');
 * console.log(location.toString()); // "Vila Mariana, São Paulo-SP"
 */
export class ProjectLocation {
  private readonly city: string;
  private readonly neighborhood: string;
  private readonly state: string;

  constructor(city: string, neighborhood: string, state: string) {
    // Validate inputs
    if (!city || city.trim().length === 0) {
      throw new Error('City is required');
    }
    if (!neighborhood || neighborhood.trim().length === 0) {
      throw new Error('Neighborhood is required');
    }
    if (!state || state.trim().length === 0) {
      throw new Error('State is required');
    }
    if (state.length !== 2) {
      throw new Error('State must be a 2-letter code (e.g., SP, RJ)');
    }

    this.city = city.trim();
    this.neighborhood = neighborhood.trim();
    this.state = state.trim().toUpperCase();
  }

  /**
   * Get city name
   */
  getCity(): string {
    return this.city;
  }

  /**
   * Get neighborhood name
   */
  getNeighborhood(): string {
    return this.neighborhood;
  }

  /**
   * Get state code
   */
  getState(): string {
    return this.state;
  }

  /**
   * Format as human-readable string
   */
  toString(): string {
    return `${this.neighborhood}, ${this.city}-${this.state}`;
  }

  /**
   * Check if equal to another ProjectLocation
   */
  equals(other: ProjectLocation): boolean {
    return (
      this.city === other.city &&
      this.neighborhood === other.neighborhood &&
      this.state === other.state
    );
  }

  /**
   * Create ProjectLocation from JSON
   */
  static fromJSON(json: { city: string; neighborhood: string; state: string }): ProjectLocation {
    return new ProjectLocation(json.city, json.neighborhood, json.state);
  }

  /**
   * Create from string format "Neighborhood, City-ST"
   */
  static fromString(str: string): ProjectLocation {
    const match = str.match(/^(.+),\s*(.+)-([A-Z]{2})$/);
    if (!match) {
      throw new Error('Invalid location string format. Expected: "Neighborhood, City-ST"');
    }

    const [, neighborhood, city, state] = match;
    return new ProjectLocation(city, neighborhood, state);
  }

  /**
   * Convert to JSON
   */
  toJSON(): { city: string; neighborhood: string; state: string } {
    return {
      city: this.city,
      neighborhood: this.neighborhood,
      state: this.state,
    };
  }
}
