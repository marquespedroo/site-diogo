/**
 * Shared Utilities for ImobiTools
 * Browser-compatible utility functions used across all modules
 */

// ===== LOGGER =====
/**
 * Browser-compatible logger utility
 * Provides structured logging with context support
 */
const logger = {
  /**
   * Log debug message
   * @param {string} message - Message to log
   * @param {Object} context - Optional context
   */
  debug(message, context) {
    // Check if running in development mode (browser-safe check)
    const isDev = typeof process === 'undefined' || (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');
    if (isDev) {
      const timestamp = new Date().toISOString();
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      console.debug(`[${timestamp}] [ImobiTools] [DEBUG] ${message}${contextStr}`);
    }
  },

  /**
   * Log info message
   * @param {string} message - Message to log
   * @param {Object} context - Optional context
   */
  info(message, context) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    console.info(`[${timestamp}] [ImobiTools] [INFO] ${message}${contextStr}`);
  },

  /**
   * Log warning message
   * @param {string} message - Message to log
   * @param {Object} context - Optional context
   */
  warn(message, context) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    console.warn(`[${timestamp}] [ImobiTools] [WARN] ${message}${contextStr}`);
  },

  /**
   * Log error message
   * @param {string} message - Message to log
   * @param {Error} error - Optional error object
   * @param {Object} context - Optional context
   */
  error(message, error, context) {
    const timestamp = new Date().toISOString();
    const errorContext = error
      ? { ...context, error: { message: error.message, stack: error.stack } }
      : context;
    const contextStr = errorContext ? ` ${JSON.stringify(errorContext)}` : '';
    console.error(`[${timestamp}] [ImobiTools] [ERROR] ${message}${contextStr}`);
  },
};

// ===== CURRENCY FORMATTING =====
/**
 * Format a number value as Brazilian Real (BRL) currency
 * @param {number} value - The numeric value to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with thousand separators
 * @param {number} value - The numeric value to format
 * @returns {string} Formatted number string
 */
function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

// ===== TOAST NOTIFICATIONS =====
/**
 * Display a toast notification
 * @param {string} message - The message to display
 * @param {'success' | 'error'} type - The type of toast
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? COLORS.SUCCESS : COLORS.DANGER;

  toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 24px;
        background: ${bgColor};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== UUID VALIDATION =====
/**
 * Check if a string is a valid UUID (v1-v5)
 * @param {string} str - The string to validate
 * @returns {boolean} true if valid UUID, false otherwise
 */
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ===== CONSTANTS =====
/**
 * Application color palette
 */
const COLORS = {
  SUCCESS: '#2dce89',
  DANGER: '#f5365c',
  PRIMARY: '#667eea',
  SECONDARY: '#764ba2',
  TEXT_MUTED: '#8392AB',
  TEXT_PRIMARY: '#172B4D',
  BORDER: '#DEE2E6',
};

/**
 * Pagination configuration
 */
const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
};

/**
 * Chart rendering configuration
 */
const CHART_CONFIG = {
  PADDING: 40,
  GRID_LINES: 5,
  LINE_WIDTH: 3,
  POINT_RADIUS: 4,
};

// Make utilities globally available
window.ImobiUtils = {
  formatCurrency,
  formatNumber,
  showToast,
  isValidUUID,
  logger,
  COLORS,
  PAGINATION,
  CHART_CONFIG,
};
