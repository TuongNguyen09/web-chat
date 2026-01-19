/**
 * Centralized logging utility
 * Provides consistent logging across the application
 * Can be extended to send logs to error tracking services (Sentry, etc.)
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log levels
 */
export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

/**
 * Logger utility
 */
export const logger = {
  /**
   * Log error
   * @param {string} context - Context where error occurred (e.g., "createChat", "bootstrapSession")
   * @param {Error|any} error - Error object or error message
   * @param {Object} metadata - Additional metadata to log
   */
  error: (context, error, metadata = {}) => {
    const message = error?.message || error || 'Unknown error';
    const stack = error?.stack;
    
    console.error(`[${context}]`, message, metadata, stack ? { stack } : '');
    
    // TODO: Send to error tracking service (Sentry, etc.)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     tags: { context },
    //     extra: metadata,
    //   });
    // }
  },

  /**
   * Log warning
   * @param {string} context - Context where warning occurred
   * @param {string} message - Warning message
   * @param {Object} metadata - Additional metadata to log
   */
  warn: (context, message, metadata = {}) => {
    console.warn(`[${context}]`, message, metadata);
  },

  /**
   * Log info
   * @param {string} context - Context where info occurred
   * @param {string} message - Info message
   * @param {Object} metadata - Additional metadata to log
   */
  info: (context, message, metadata = {}) => {
    if (isDevelopment) {
      console.info(`[${context}]`, message, metadata);
    }
  },

  /**
   * Log debug (only in development)
   * @param {string} context - Context where debug occurred
   * @param {string} message - Debug message
   * @param {Object} metadata - Additional metadata to log
   */
  debug: (context, message, metadata = {}) => {
    if (isDevelopment) {
      console.debug(`[${context}]`, message, metadata);
    }
  },
};
