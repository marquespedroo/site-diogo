/**
 * Cryptographic Utilities
 * Provides secure code generation and cryptographic operations
 */

/**
 * Generate a cryptographically secure random code
 *
 * Uses the Web Crypto API to generate truly random codes suitable for
 * security-sensitive operations like short codes, tokens, and identifiers.
 *
 * @param length - The length of the code to generate (default: 12)
 * @returns A random alphanumeric code
 *
 * @example
 * ```typescript
 * generateSecureCode(6) // "a7k2m9"
 * generateSecureCode(12) // "x4p9q2k8m1n7"
 * ```
 */
export function generateSecureCode(length: number = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(array[i] % chars.length);
  }
  return code;
}
