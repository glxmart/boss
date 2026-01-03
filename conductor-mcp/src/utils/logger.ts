/**
 * Structured logging utilities
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  workerId?: string;
  workerType?: string;
  [key: string]: unknown;
}

class Logger {
  private minLevel: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    // Output to stderr for structured logging
    const output =
      level === LogLevel.ERROR || level === LogLevel.WARN ? console.error : console.log;

    output(JSON.stringify(logEntry));
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= minLevelIndex;
  }
}

export const logger = new Logger();

// Set level from environment variable
if (process.env.LOG_LEVEL) {
  const envLevel = process.env.LOG_LEVEL.toLowerCase();
  if (Object.values(LogLevel).includes(envLevel as LogLevel)) {
    logger.setLevel(envLevel as LogLevel);
  }
}
