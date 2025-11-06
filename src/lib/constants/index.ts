/**
 * Application Constants
 * Centralized constants used across the application
 */

/**
 * Color palette used throughout the application
 * Ensures consistent styling and branding
 */
export const COLORS = {
  SUCCESS: '#2dce89',
  DANGER: '#f5365c',
  PRIMARY: '#667eea',
  SECONDARY: '#764ba2',
  TEXT_MUTED: '#8392AB',
  TEXT_PRIMARY: '#172B4D',
  BORDER: '#DEE2E6',
} as const;

/**
 * Pagination configuration
 * Default values for database queries
 */
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
} as const;

/**
 * Chart rendering configuration
 * Used for consistent chart styling
 */
export const CHART_CONFIG = {
  PADDING: 40,
  GRID_LINES: 5,
  LINE_WIDTH: 3,
  POINT_RADIUS: 4,
} as const;
