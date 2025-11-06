/**
 * Logging Utility
 * Provides structured logging with different severity levels
 *
 * Features:
 * - Environment-aware (respects NODE_ENV and LOG_LEVEL)
 * - Structured log format with timestamps
 * - Context support for better debugging
 * - Type-safe logging methods
 */

/**
 * Log severity levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Log context for additional metadata
 */
interface LogContext {
  [key: string]: any;
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  /** Minimum log level to display (default: INFO) */
  minLevel?: LogLevel;
  /** Enable/disable logging (default: true in development, false in production) */
  enabled?: boolean;
  /** Prefix for all log messages (default: 'ImobiTools') */
  prefix?: string;
}

class Logger {
  private minLevel: LogLevel;
  private enabled: boolean;
  private prefix: string;

  constructor(config: LoggerConfig = {}) {
    // Default to INFO level
    this.minLevel = config.minLevel || LogLevel.INFO;

    // Enable logging by default in development, disable in production
    this.enabled = config.enabled ?? process.env.NODE_ENV !== 'production';

    // Default prefix
    this.prefix = config.prefix || 'ImobiTools';

    // Allow environment variable override
    const envLevel = process.env.LOG_LEVEL as LogLevel;
    if (envLevel && Object.values(LogLevel).includes(envLevel)) {
      this.minLevel = envLevel;
    }
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;

    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentIndex = levels.indexOf(this.minLevel);
    const requestedIndex = levels.indexOf(level);

    return requestedIndex >= currentIndex;
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${this.prefix}] [${level}] ${message}${contextStr}`;
  }

  /**
   * Log a debug message
   *
   * Use for detailed information useful during development.
   *
   * @param message - The message to log
   * @param context - Optional additional context
   *
   * @example
   * ```typescript
   * logger.debug('User input validated', { userId: '123', input: 'value' })
   * ```
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  /**
   * Log an info message
   *
   * Use for general informational messages about application flow.
   *
   * @param message - The message to log
   * @param context - Optional additional context
   *
   * @example
   * ```typescript
   * logger.info('Calculator created', { calculatorId: 'calc-123' })
   * ```
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  /**
   * Log a warning message
   *
   * Use for potentially harmful situations that aren't errors.
   *
   * @param message - The message to log
   * @param context - Optional additional context
   *
   * @example
   * ```typescript
   * logger.warn('Using deprecated API endpoint', { endpoint: '/old-api' })
   * ```
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  /**
   * Log an error message
   *
   * Use for error conditions that need immediate attention.
   *
   * @param message - The message to log
   * @param error - Optional error object
   * @param context - Optional additional context
   *
   * @example
   * ```typescript
   * logger.error('Failed to save calculator', error, { calculatorId: 'calc-123' })
   * ```
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error
        ? { ...context, error: { message: error.message, stack: error.stack } }
        : context;
      console.error(this.formatMessage(LogLevel.ERROR, message, errorContext));
    }
  }

  /**
   * Set the minimum log level
   *
   * @param level - The minimum level to log
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Enable or disable logging
   *
   * @param enabled - Whether to enable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

/**
 * Default logger instance
 *
 * @example
 * ```typescript
 * import { logger } from '@/lib/utils/logger';
 *
 * logger.info('Application started');
 * logger.error('Database connection failed', error);
 * ```
 */
export const logger = new Logger();

/**
 * Create a custom logger instance with specific configuration
 *
 * @param config - Logger configuration
 * @returns A new logger instance
 *
 * @example
 * ```typescript
 * const dbLogger = createLogger({ prefix: 'Database', minLevel: LogLevel.DEBUG });
 * dbLogger.debug('Query executed', { query: 'SELECT * FROM users' });
 * ```
 */
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}
