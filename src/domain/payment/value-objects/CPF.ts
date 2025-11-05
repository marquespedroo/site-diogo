import { ValidationError } from '@/lib/errors';

/**
 * CPF Value Object
 *
 * Immutable value object representing Brazilian CPF (Cadastro de Pessoas Físicas).
 * Validates CPF according to Brazilian government rules.
 * Follows Value Object pattern from DDD.
 *
 * @example
 * const cpf = new CPF('123.456.789-09');
 * const formatted = cpf.format(); // "123.456.789-09"
 * const raw = cpf.getValue(); // "12345678909"
 */
export class CPF {
  private readonly value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new ValidationError('Invalid CPF format or check digits');
    }
    // Store cleaned version (digits only)
    this.value = this.clean(value);
  }

  /**
   * Validate CPF according to Brazilian algorithm
   */
  private isValid(cpf: string): boolean {
    // Remove formatting
    const cleaned = this.clean(cpf);

    // Check length
    if (cleaned.length !== 11) {
      return false;
    }

    // Check if all digits are the same (invalid)
    if (/^(\d)\1{10}$/.test(cleaned)) {
      return false;
    }

    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned.charAt(9))) {
      return false;
    }

    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned.charAt(10))) {
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
   * Get raw CPF value (digits only)
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Format CPF as XXX.XXX.XXX-XX
   */
  format(): string {
    return this.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Check equality with another CPF
   */
  equals(other: CPF): boolean {
    return this.value === other.value;
  }

  /**
   * Convert to JSON
   */
  toJSON(): { value: string } {
    return { value: this.value };
  }

  /**
   * Create CPF from JSON
   */
  static fromJSON(json: { value: string }): CPF {
    return new CPF(json.value);
  }
}
