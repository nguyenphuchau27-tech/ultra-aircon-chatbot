import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, headers } = req;

    // Log incoming request
    logger.log(`Incoming ${method} ${originalUrl}`, {
      method,
      url: originalUrl,
      ip: this.getClientIP(req),
      userAgent: headers['user-agent'],
      contentType: headers['content-type'],
      contentLength: headers['content-length'],
    });

    // Log request body for sensitive operations (sanitized)
    if (this.shouldLogBody(method, originalUrl)) {
      const sanitizedBody = this.sanitizeRequestBody(req.body);
      logger.debug(`Request body for ${method} ${originalUrl}`, { body: sanitizedBody });
    }

    // Override response methods to capture response data
    const originalSend = res.send;
    const originalJson = res.json;

    let responseBody: any = null;

    res.send = function (body: any) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.json = function (body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      logger.log(`Response ${method} ${originalUrl} - ${statusCode}`, {
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        responseSize: responseBody ? JSON.stringify(responseBody).length : 0,
      });

      // Log security events
      if (statusCode >= 400) {
        logger.warn(`HTTP ${statusCode} for ${method} ${originalUrl}`, {
          method,
          url: originalUrl,
          statusCode,
          ip: this.getClientIP(req),
          userAgent: headers['user-agent'],
          duration: `${duration}ms`,
        });
      }

      // Log slow requests
      if (duration > 5000) {
        logger.warn(`Slow request: ${method} ${originalUrl}`, {
          method,
          url: originalUrl,
          duration: `${duration}ms`,
          ip: this.getClientIP(req),
        });
      }
    });

    next();
  }

  private shouldLogBody(method: string, url: string): boolean {
    // Only log bodies for sensitive operations in development
    if (process.env.NODE_ENV !== 'development') {
      return false;
    }

    const sensitivePaths = ['/auth/login', '/auth/register', '/users'];
    return (
      ['POST', 'PUT', 'PATCH'].includes(method) && sensitivePaths.some(path => url.includes(path))
    );
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'ssn'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private getClientIP(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}



