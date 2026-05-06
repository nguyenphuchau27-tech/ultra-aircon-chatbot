import { Module } from '@nestjs/common';

import { QueryOptimizationService } from './query-optimization.service';
import { PerformanceMonitoringService } from './performance-monitoring.service';
import { MemoryOptimizationService } from './memory-optimization.service';
import { ScalabilityService } from './scalability.service';
import { ResponseInterceptor } from './interceptors/response.interceptor';

@Module({
  providers: [
    QueryOptimizationService,
    PerformanceMonitoringService,
    MemoryOptimizationService,
    ScalabilityService,
    ResponseInterceptor,
  ],
  exports: [
    QueryOptimizationService,
    PerformanceMonitoringService,
    MemoryOptimizationService,
    ScalabilityService,
    ResponseInterceptor,
  ],
})
export class CommonModule {}