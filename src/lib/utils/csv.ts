import { Unit } from '../../domain/projects/entities/Unit';

/**
 * CSV Utilities
 *
 * Utilities for parsing and generating CSV files for unit import/export.
 * Handles Brazilian number formatting and common data transformations.
 */

/**
 * CSV Parse Error
 */
export class CSVParseError extends Error {
  constructor(
    message: string,
    public readonly row: number,
    public readonly column?: string
  ) {
    super(`CSV Parse Error (row ${row}${column ? `, column '${column}'` : ''}): ${message}`);
    this.name = 'CSVParseError';
  }
}

/**
 * CSV Row Interface (parsed from file)
 */
export interface CSVRow {
  [key: string]: string;
}

/**
 * CSV Parser Options
 */
export interface CSVParserOptions {
  delimiter?: string;
  skipEmptyLines?: boolean;
  trim?: boolean;
}

/**
 * CSV Generator Options
 */
export interface CSVGeneratorOptions {
  delimiter?: string;
  includeHeaders?: boolean;
  columnOrder?: string[];
}

/**
 * CSV Parser
 *
 * Parses CSV strings into objects.
 * Supports custom delimiters and Brazilian number formats.
 */
export class CSVParser {
  private readonly delimiter: string;
  private readonly skipEmptyLines: boolean;
  private readonly trim: boolean;

  constructor(options: CSVParserOptions = {}) {
    this.delimiter = options.delimiter || ',';
    this.skipEmptyLines = options.skipEmptyLines !== false;
    this.trim = options.trim !== false;
  }

  /**
   * Parse CSV string into array of objects
   *
   * @param csvString - CSV content as string
   * @returns Array of parsed rows
   * @throws {CSVParseError} if parsing fails
   */
  parse(csvString: string): CSVRow[] {
    const lines = csvString.split(/\r?\n/);
    if (lines.length === 0) {
      return [];
    }

    // Parse header row
    const headers = this.parseRow(lines[0]);
    if (headers.length === 0) {
      throw new CSVParseError('Header row is empty', 1);
    }

    // Parse data rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines if configured
      if (this.skipEmptyLines && line.trim().length === 0) {
        continue;
      }

      const values = this.parseRow(line);

      // Skip if no values
      if (values.length === 0 && this.skipEmptyLines) {
        continue;
      }

      // Create row object
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      rows.push(row);
    }

    return rows;
  }

  /**
   * Parse a single CSV row
   *
   * Handles quoted values and escaped quotes.
   *
   * @param line - CSV line
   * @returns Array of values
   */
  private parseRow(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === this.delimiter && !inQuotes) {
        // End of value
        values.push(this.trim ? currentValue.trim() : currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    // Add last value
    values.push(this.trim ? currentValue.trim() : currentValue);

    return values;
  }

  /**
   * Parse CSV buffer (for file uploads)
   *
   * @param buffer - Buffer containing CSV data
   * @returns Array of parsed rows
   */
  static parseBuffer(buffer: Buffer): CSVRow[] {
    const csvString = buffer.toString('utf-8');
    return new CSVParser().parse(csvString);
  }
}

/**
 * CSV Generator
 *
 * Generates CSV strings from objects.
 * Supports custom column ordering and Brazilian formatting.
 */
export class CSVGenerator {
  private readonly delimiter: string;
  private readonly includeHeaders: boolean;
  private readonly columnOrder?: string[];

  constructor(options: CSVGeneratorOptions = {}) {
    this.delimiter = options.delimiter || ',';
    this.includeHeaders = options.includeHeaders !== false;
    this.columnOrder = options.columnOrder;
  }

  /**
   * Generate CSV string from array of objects
   *
   * @param rows - Array of row objects
   * @returns CSV string
   */
  generate(rows: Array<Record<string, any>>): string {
    if (rows.length === 0) {
      return '';
    }

    // Determine columns
    const columns = this.columnOrder || Object.keys(rows[0]);

    // Build CSV lines
    const lines: string[] = [];

    // Add header row
    if (this.includeHeaders) {
      lines.push(this.formatRow(columns));
    }

    // Add data rows
    rows.forEach((row) => {
      const values = columns.map((col) => {
        const value = row[col];
        return value !== undefined && value !== null ? String(value) : '';
      });
      lines.push(this.formatRow(values));
    });

    return lines.join('\n');
  }

  /**
   * Format a single CSV row
   *
   * Handles escaping and quoting.
   *
   * @param values - Array of values
   * @returns Formatted CSV line
   */
  private formatRow(values: string[]): string {
    return values
      .map((value) => {
        // Convert to string
        const str = String(value);

        // Check if quoting is needed
        const needsQuotes =
          str.includes(this.delimiter) ||
          str.includes('"') ||
          str.includes('\n') ||
          str.includes('\r');

        if (needsQuotes) {
          // Escape quotes and wrap in quotes
          return `"${str.replace(/"/g, '""')}"`;
        }

        return str;
      })
      .join(this.delimiter);
  }
}

/**
 * Unit CSV Exporter
 *
 * Specialized exporter for Unit entities.
 * Formats data for Brazilian real estate context.
 */
export class UnitCSVExporter {
  /**
   * Export units to CSV string
   *
   * @param units - Array of Unit entities
   * @param projectName - Project name (included in export)
   * @returns CSV string
   */
  static export(units: Unit[], projectName?: string): string {
    const rows = units.map((unit) => ({
      Empreendimento: projectName || '',
      Torre: unit.getIdentifier().getTower(),
      Unidade: unit.getIdentifier().getNumber(),
      Vagas: unit.getParkingSpots(),
      Origem: unit.getOrigin(),
      'Área (m²)': unit.getArea().getSquareMeters().toFixed(2),
      'Valor Total': this.formatMoney(unit.getPrice().getAmount()),
      'Valor/m²': this.formatMoney(unit.getPricePerSqM().getAmount()),
      Status: this.translateStatus(unit.getStatus()),
    }));

    return new CSVGenerator({
      columnOrder: [
        'Empreendimento',
        'Torre',
        'Unidade',
        'Vagas',
        'Origem',
        'Área (m²)',
        'Valor Total',
        'Valor/m²',
        'Status',
      ],
    }).generate(rows);
  }

  /**
   * Format money value in Brazilian format
   */
  private static formatMoney(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Translate status to Portuguese
   */
  private static translateStatus(status: string): string {
    const translations: Record<string, string> = {
      available: 'Disponível',
      reserved: 'Reservado',
      sold: 'Vendido',
      unavailable: 'Indisponível',
    };
    return translations[status] || status;
  }
}

/**
 * Unit CSV Importer
 *
 * Specialized importer for Unit entities from CSV.
 * Handles Brazilian number formats and validates data.
 */
export class UnitCSVImporter {
  /**
   * Expected CSV headers (case-insensitive)
   */
  private static readonly EXPECTED_HEADERS = [
    'torre',
    'unidade',
    'area',
    'valor',
    'vagas',
    'origem',
  ];

  /**
   * Validate CSV headers
   *
   * @param headers - Array of header strings
   * @returns true if valid
   * @throws {CSVParseError} if invalid
   */
  static validateHeaders(headers: string[]): boolean {
    const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

    const missingHeaders = this.EXPECTED_HEADERS.filter(
      (expected) => !normalizedHeaders.includes(expected)
    );

    if (missingHeaders.length > 0) {
      throw new CSVParseError(
        `Missing required columns: ${missingHeaders.join(', ')}`,
        1
      );
    }

    return true;
  }

  /**
   * Parse number from Brazilian format
   *
   * Handles formats like:
   * - "1.500,50" -> 1500.50
   * - "R$ 150.000,00" -> 150000.00
   * - "150000" -> 150000
   *
   * @param value - String value
   * @returns Parsed number
   */
  static parseNumber(value: string): number {
    // Remove currency symbols and spaces
    let cleaned = value.replace(/[R$\s]/g, '');

    // Check if using Brazilian format (comma as decimal separator)
    const hasBrazilianFormat = /\d+\.\d{3}/.test(cleaned);

    if (hasBrazilianFormat) {
      // Remove thousand separators (dots) and convert comma to dot
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }

    const parsed = parseFloat(cleaned);

    if (isNaN(parsed)) {
      throw new Error(`Invalid number format: ${value}`);
    }

    return parsed;
  }
}
