/**
 * Development-only logging utility
 * Provides conditional logging that is stripped from production builds
 */

interface LogLevel {
  DEBUG: 'debug';
  ERROR: 'error';
  INFO: 'info';
  WARN: 'warn';
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  ERROR: 'error',
  INFO: 'info',
  WARN: 'warn',
} as const;

type LogLevelType = LogLevel[keyof LogLevel];

interface LogContext {
  component?: string;
  function?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Development-only logger that is completely stripped from production builds
 */
class DevLogger {
  private isDevelopment = __DEV__;

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log(LOG_LEVELS.DEBUG, message, context);
    }
  }

  /**
   * Log error information (development only)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.isDevelopment) {
      const errorContext = error instanceof Error 
        ? { ...context, error: error.message, stack: error.stack }
        : { ...context, error };
      this.log(LOG_LEVELS.ERROR, message, errorContext);
    }
  }

  /**
   * Log general information (development only)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log(LOG_LEVELS.INFO, message, context);
    }
  }

  /**
   * Log warning information (development only)
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log(LOG_LEVELS.WARN, message, context);
    }
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevelType, message: string, context?: LogContext): void {
    if (!this.isDevelopment) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context && Object.keys(context).length > 0) {
      // eslint-disable-next-line no-console
      console.log(`${prefix} ${message}`, context);
    } else {
      // eslint-disable-next-line no-console
      console.log(`${prefix} ${message}`);
    }
  }
}

// Export singleton instance
export const logger = new DevLogger();

// Export types for use in other files
export type { LogContext, LogLevelType };