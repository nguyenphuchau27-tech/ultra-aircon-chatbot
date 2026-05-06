import { Injectable, Logger } from '@nestjs/common';

export interface LogContext {
  [key: string]: any;
}

@Injectable()
export class LoggerService {
  private logger = new Logger();

  log(message: string, context?: LogContext) {
    this.logger.log(`${message}`, this.sanitizeContext(context));
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.logger.error(`${message}`, error?.stack, {
      ...this.sanitizeContext(context),
      error: error?.message,
    });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(`${message}`, this.sanitizeContext(context));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`${message}`, this.sanitizeContext(context));
    }
  }

  private sanitizeContext(context?: LogContext): LogContext {
    if (!context) return {};

    const sanitized = { ...context };
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'jwt',
      'apiKey',
      'authorization',
      'creditCard',
      'ssn',
    ];

    for (const key of sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

export const logger = new LoggerService();
