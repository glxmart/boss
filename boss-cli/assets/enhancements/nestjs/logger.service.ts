import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import pino from 'pino';

/**
 * Pino-based logger service for NestJS applications.
 *
 * Usage in main.ts:
 * ```ts
 * import { PinoLoggerService } from './common/logger.service';
 *
 * const app = await NestFactory.create(AppModule, {
 *   logger: new PinoLoggerService(),
 * });
 * ```
 *
 * Usage in services:
 * ```ts
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly logger: PinoLoggerService) {}
 *
 *   doSomething() {
 *     this.logger.log('Processing...', 'MyService');
 *   }
 * }
 * ```
 */
@Injectable({ scope: Scope.TRANSIENT })
export class PinoLoggerService implements NestLoggerService {
  private readonly logger: pino.Logger;
  private context?: string;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
      base: {
        env: process.env.NODE_ENV,
      },
      formatters: {
        level: (label) => ({ level: label }),
      },
    });
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, context?: string): void {
    this.logger.info({ context: context || this.context }, message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context: context || this.context, trace }, message);
  }

  warn(message: string, context?: string): void {
    this.logger.warn({ context: context || this.context }, message);
  }

  debug(message: string, context?: string): void {
    this.logger.debug({ context: context || this.context }, message);
  }

  verbose(message: string, context?: string): void {
    this.logger.trace({ context: context || this.context }, message);
  }

  /**
   * Get the underlying pino logger for advanced usage
   */
  getLogger(): pino.Logger {
    return this.logger;
  }

  /**
   * Create a child logger with additional context
   */
  child(bindings: pino.Bindings): pino.Logger {
    return this.logger.child(bindings);
  }
}
