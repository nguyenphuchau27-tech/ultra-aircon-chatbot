import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  PerformanceMonitoringService,
  PerformanceMetrics,
} from '../common/performance-monitoring.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly performanceService: PerformanceMonitoringService;

  constructor(performanceService: PerformanceMonitoringService) {
    this.performanceService = performanceService;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;

        const metric: PerformanceMetrics = {
          endpoint: request.url,
          method: request.method,
          responseTime,
          statusCode: response.statusCode,
          timestamp: new Date(),
          userAgent: request.get('User-Agent'),
          ip: request.ip || request.connection.remoteAddress,
        };

        // Record metric asynchronously (don't block response)
        globalThis.setImmediate(() => {
          this.performanceService.recordMetric(metric);
        });
      }),
    );
  }
}



