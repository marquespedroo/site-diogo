import { ValidationError } from '@/lib/errors';

/**
 * CNPJ Value Object
 *
 * Immutable value object representing Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica).
 * Validates CNPJ according to Brazilian government rules.
 * Follows Value Object pattern from DDD.
 *
 * @example
 * const cnpj = new CNPJ('12.345.678/0001-90');
 * const formatted = cnpj.format(); // "12.345.678/0001-90"
 * const raw = cnpj.getValue(); // "12345678000190"
 */
export class CNPJ {
  private readonly value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new ValidationError('Invalid CNPJ format or check digits');
    }
    // Store cleaned version (digits only)
    this.value = this.clean(value);
  }

  /**
   * Validate CNPJ according to Brazilian algorithm
   */
  private isValid(cnpj: string): boolean {
    // Remove formatting
    const cleaned = this.clean(cnpj);

    // Check length
    if (cleaned.length !== 14) {
      return false;
    }

    // Check if all digits are the same (invalid)
    if (/^(\d)\1{13}$/.test(cleaned)) {
      return false;
    }

    // Validate first check digit
    let length = cleaned.length - 2;
    let numbers = cleaned.substring(0, length);
    const digits = cleaned.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) {
      return false;
    }

    // Validate second check digit
    length = length + 1;
    numbers = cleaned.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) {
      return false;
    }

    return true;
  }

  /**
   * Remove all non-digit characters
   */
  private clean(value: string): string {
    return value.replace(/[^\d]/g, '');
  }

  /**
   * Get raw CNPJ value (digits only)
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Format CNPJ as XX.XXX.XXX/XXXX-XX
   */
  format(): string {
    return this.value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  /**
   * Check equality with another CNPJ
   */
  equals(other: CNPJ): boolean {
    return this.value === other.value;
  }

  /**
   * Convert to JSON
   */
  toJSON(): { value: string } {
    return { value: this.value };
  }

  /**
   * Create CNPJ from JSON
   */
  static fromJSON(json: { value: string }): CNPJ {
    return new CNPJ(json.value);
  }
}
