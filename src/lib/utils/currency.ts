/**
 * Currency Formatting Utility
 * Provides consistent currency formatting across the application
 */

/**
 * Format a number value as Brazilian Real (BRL) currency
 *
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "R$ 1.234,56")
 *
 * @example
 * ```typescript
 * formatCurrency(1234.56) // "R$ 1.234,56"
 * formatCurrency(0) // "R$ 0,00"
 * ```
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with thousand separators
 *
 * Uses Brazilian Portuguese locale for consistent number formatting.
 *
 * @param value - The numeric value to format
 * @returns Formatted number string (e.g., "1.234,56")
 *
 * @example
 * ```typescript
 * formatNumber(1234.56) // "1.234,56"
 * formatNumber(1000000) // "1.000.000"
 * ```
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}
