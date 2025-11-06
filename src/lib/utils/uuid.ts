/**
 * UUID Validation Utility
 * Provides UUID validation across the application
 */

/**
 * Check if a string is a valid UUID (v1-v5)
 *
 * @param str - The string to validate
 * @returns true if the string is a valid UUID, false otherwise
 *
 * @example
 * ```typescript
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000') // true
 * isValidUUID('not-a-uuid') // false
 * ```
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
