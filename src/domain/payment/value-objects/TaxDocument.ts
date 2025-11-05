import { CPF } from './CPF';
import { CNPJ } from './CNPJ';
import { ValidationError } from '@/lib/errors';

/**
 * Tax Document Type
 */
export type TaxDocumentType = 'cpf' | 'cnpj';

/**
 * TaxDocument Value Object
 *
 * Unified value object representing either CPF or CNPJ.
 * Automatically detects document type based on length.
 * Follows Value Object pattern from DDD.
 *
 * @example
 * const cpfDoc = TaxDocument.fromCPF('123.456.789-09');
 * const cnpjDoc = TaxDocument.fromCNPJ('12.345.678/0001-90');
 * const autoDoc = TaxDocument.create('12345678909'); // Auto-detects as CPF
 */
export class TaxDocument {
  private readonly type: TaxDocumentType;
  private readonly document: CPF | CNPJ;

  private constructor(type: TaxDocumentType, document: CPF | CNPJ) {
    this.type = type;
    this.document = document;
  }

  /**
   * Create TaxDocument from CPF
   */
  static fromCPF(cpf: string): TaxDocument {
    return new TaxDocument('cpf', new CPF(cpf));
  }

  /**
   * Create TaxDocument from CNPJ
   */
  static fromCNPJ(cnpj: string): TaxDocument {
    return new TaxDocument('cnpj', new CNPJ(cnpj));
  }

  /**
   * Auto-detect document type and create appropriate instance
   */
  static create(document: string): TaxDocument {
    // Remove formatting
    const cleaned = document.replace(/[^\d]/g, '');

    if (cleaned.length === 11) {
      return TaxDocument.fromCPF(document);
    } else if (cleaned.length === 14) {
      return TaxDocument.fromCNPJ(document);
    } else {
      throw new ValidationError(
        'Invalid tax document: must be CPF (11 digits) or CNPJ (14 digits)'
      );
    }
  }

  /**
   * Get document type
   */
  getType(): TaxDocumentType {
    return this.type;
  }

  /**
   * Get raw document value (digits only)
   */
  getValue(): string {
    return this.document.getValue();
  }

  /**
   * Format document according to type
   */
  format(): string {
    return this.document.format();
  }

  /**
   * Check if document is CPF
   */
  isCPF(): boolean {
    return this.type === 'cpf';
  }

  /**
   * Check if document is CNPJ
   */
  isCNPJ(): boolean {
    return this.type === 'cnpj';
  }

  /**
   * Get document as CPF (throws if not CPF)
   */
  asCPF(): CPF {
    if (!this.isCPF()) {
      throw new Error('TaxDocument is not a CPF');
    }
    return this.document as CPF;
  }

  /**
   * Get document as CNPJ (throws if not CNPJ)
   */
  asCNPJ(): CNPJ {
    if (!this.isCNPJ()) {
      throw new Error('TaxDocument is not a CNPJ');
    }
    return this.document as CNPJ;
  }

  /**
   * Check equality with another TaxDocument
   */
  equals(other: TaxDocument): boolean {
    return (
      this.type === other.type && this.getValue() === other.getValue()
    );
  }

  /**
   * Convert to JSON
   */
  toJSON(): { type: TaxDocumentType; value: string } {
    return {
      type: this.type,
      value: this.getValue(),
    };
  }

  /**
   * Create TaxDocument from JSON
   */
  static fromJSON(json: { type: TaxDocumentType; value: string }): TaxDocument {
    if (json.type === 'cpf') {
      return TaxDocument.fromCPF(json.value);
    } else {
      return TaxDocument.fromCNPJ(json.value);
    }
  }
}
