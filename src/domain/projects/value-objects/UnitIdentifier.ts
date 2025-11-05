/**
 * UnitIdentifier Value Object
 *
 * Immutable value object representing a unit's identifier (tower + number).
 * Follows Value Object pattern from DDD.
 *
 * @example
 * const id = new UnitIdentifier('A', '101');
 * console.log(id.toString()); // "A-101"
 */
export class UnitIdentifier {
  private readonly tower: string;
  private readonly number: string;

  constructor(tower: string, number: string) {
    // Validate inputs
    if (!tower || tower.trim().length === 0) {
      throw new Error('Tower is required');
    }
    if (!number || number.trim().length === 0) {
      throw new Error('Unit number is required');
    }

    this.tower = tower.trim().toUpperCase();
    this.number = number.trim();
  }

  /**
   * Get tower identifier
   */
  getTower(): string {
    return this.tower;
  }

  /**
   * Get unit number
   */
  getNumber(): string {
    return this.number;
  }

  /**
   * Format as string "Tower-Number"
   */
  toString(): string {
    return `${this.tower}-${this.number}`;
  }

  /**
   * Check if equal to another UnitIdentifier
   */
  equals(other: UnitIdentifier): boolean {
    return this.tower === other.tower && this.number === other.number;
  }

  /**
   * Create UnitIdentifier from JSON
   */
  static fromJSON(json: { tower: string; number: string }): UnitIdentifier {
    return new UnitIdentifier(json.tower, json.number);
  }

  /**
   * Create from string format "Tower-Number"
   */
  static fromString(str: string): UnitIdentifier {
    const parts = str.split('-');
    if (parts.length !== 2) {
      throw new Error(
        'Invalid unit identifier format. Expected: "Tower-Number"'
      );
    }

    const [tower, number] = parts;
    return new UnitIdentifier(tower, number);
  }

  /**
   * Convert to JSON
   */
  toJSON(): { tower: string; number: string } {
    return {
      tower: this.tower,
      number: this.number,
    };
  }
}
