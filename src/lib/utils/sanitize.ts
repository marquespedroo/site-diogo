/**
 * Input Sanitization Utilities
 * Provides HTML and text sanitization to prevent XSS attacks
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * Uses DOMPurify to clean potentially dangerous HTML while preserving
 * safe formatting tags. Only allows a limited set of tags and attributes.
 *
 * @param dirty - Raw HTML string that may contain malicious code
 * @returns Sanitized HTML safe for rendering
 *
 * @example
 * ```typescript
 * sanitizeHTML('<b>Safe</b><script>alert("XSS")</script>') // '<b>Safe</b>'
 * sanitizeHTML('<div class="safe">Content</div>') // '<div class="safe">Content</div>'
 * ```
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'span',
      'div',
      'p',
      'br',
      'h1',
      'h2',
      'h3',
      'h4',
      'button',
      'input',
    ],
    ALLOWED_ATTR: ['class', 'style', 'type', 'id', 'name', 'value', 'placeholder'],
  });
}

/**
 * Sanitize plain text by encoding HTML entities
 *
 * Converts special characters to HTML entities to prevent them from being
 * interpreted as HTML. Useful for displaying user input as plain text.
 *
 * @param text - Plain text that may contain special characters
 * @returns Text with HTML entities encoded
 *
 * @example
 * ```typescript
 * sanitizeText('Hello <world>') // 'Hello &lt;world&gt;'
 * sanitizeText('A & B') // 'A &amp; B'
 * ```
 */
export function sanitizeText(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
