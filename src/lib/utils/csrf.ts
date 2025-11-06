/**
 * CSRF Token Utility
 *
 * Provides Cross-Site Request Forgery (CSRF) protection for forms and AJAX requests.
 * Tokens are stored in sessionStorage and must be included with state-changing requests.
 *
 * @example
 * // Generate and add token to form
 * const token = generateCSRFToken();
 * addCSRFTokenToForm(formElement);
 *
 * // Validate token on server
 * if (!validateCSRFToken(receivedToken)) {
 *   throw new Error('Invalid CSRF token');
 * }
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
const CSRF_TOKEN_FIELD = 'csrf_token';

/**
 * Generate a cryptographically secure CSRF token
 *
 * @returns A random 32-character hexadecimal string
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  // Convert to hex string
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get current CSRF token from sessionStorage, or generate a new one if it doesn't exist
 *
 * @returns The current CSRF token
 */
export function getCSRFToken(): string {
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);

  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  }

  return token;
}

/**
 * Set a new CSRF token in sessionStorage
 *
 * @param token - The CSRF token to set
 */
export function setCSRFToken(token: string): void {
  if (!token || token.length < 16) {
    throw new Error('Invalid CSRF token: must be at least 16 characters');
  }

  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
}

/**
 * Clear the CSRF token from sessionStorage
 */
export function clearCSRFToken(): void {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
}

/**
 * Validate a CSRF token against the stored token
 *
 * @param token - The token to validate
 * @returns True if the token matches the stored token
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);

  if (!storedToken || !token) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return timingSafeEqual(token, storedToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Add CSRF token to a form as a hidden input field
 *
 * @param form - The form element to add the token to
 */
export function addCSRFTokenToForm(form: HTMLFormElement): void {
  // Remove existing CSRF token field if present
  const existingField = form.querySelector(`input[name="${CSRF_TOKEN_FIELD}"]`);
  if (existingField) {
    existingField.remove();
  }

  // Create new hidden input
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = CSRF_TOKEN_FIELD;
  input.value = getCSRFToken();

  form.appendChild(input);
}

/**
 * Add CSRF token to request headers for AJAX requests
 *
 * @param headers - The headers object to add the token to
 * @returns The modified headers object
 */
export function addCSRFTokenToHeaders(
  headers: Record<string, string> = {}
): Record<string, string> {
  return {
    ...headers,
    [CSRF_TOKEN_HEADER]: getCSRFToken(),
  };
}

/**
 * Get CSRF token from form data
 *
 * @param formData - The FormData object to extract the token from
 * @returns The CSRF token or null if not found
 */
export function getCSRFTokenFromForm(formData: FormData): string | null {
  return formData.get(CSRF_TOKEN_FIELD) as string | null;
}

/**
 * Get CSRF token from request headers
 *
 * @param headers - The headers object to extract the token from
 * @returns The CSRF token or null if not found
 */
export function getCSRFTokenFromHeaders(headers: Record<string, string>): string | null {
  return headers[CSRF_TOKEN_HEADER] || headers[CSRF_TOKEN_HEADER.toLowerCase()] || null;
}

/**
 * Initialize CSRF protection for all forms on the page
 * Call this on DOMContentLoaded to automatically add CSRF tokens to all forms
 */
export function initCSRFProtection(): void {
  // Add token to all existing forms
  document.querySelectorAll('form').forEach((form) => {
    addCSRFTokenToForm(form as HTMLFormElement);
  });

  // Intercept form submissions to ensure token is present
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;

    // Skip GET forms (CSRF protection not needed for read-only operations)
    if (form.method.toUpperCase() === 'GET') {
      return;
    }

    // Ensure CSRF token is present
    const tokenField = form.querySelector(`input[name="${CSRF_TOKEN_FIELD}"]`);
    if (!tokenField) {
      addCSRFTokenToForm(form);
    }
  });

  // Intercept fetch requests to add CSRF header
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Only add CSRF token to state-changing requests (POST, PUT, DELETE, PATCH)
    const method = init?.method?.toUpperCase() || 'GET';
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      init = init || {};
      init.headers = addCSRFTokenToHeaders((init.headers as Record<string, string>) || {});
    }

    return originalFetch(input, init);
  };
}
