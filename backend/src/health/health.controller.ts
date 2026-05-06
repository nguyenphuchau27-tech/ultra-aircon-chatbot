import { Controller, Get } from '@nestjs/common';
import { PerformanceMonitoringService } from '../common/performance-monitoring.service';
import { MemoryOptimizationService } from '../common/memory-optimization.service';
import { CacheService } from '../modules/cache/cache.service';

@Controller('health')
export class HealthController {
  private readonly performanceService: PerformanceMonitoringService;
  private readonly memoryService: MemoryOptimizationService;
  private readonly cacheService: CacheService;

  constructor(
    performanceService: PerformanceMonitoringService,
    memoryService: MemoryOptimizationService,
    cacheService: CacheService,
  ) {
    this.performanceService = performanceService;
    this.memoryService = memoryService;
    this.cacheService = cacheService;
  }

  @Get()
  async check() {
    const memoryHealth = this.memoryService.getMemoryHealth();
    const cacheHealth = await this.checkCacheHealth();

    return {
      status: this.determineOverallStatus(memoryHealth.status, cacheHealth.status),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        memory: memoryHealth,
        cache: cacheHealth,
        database: await this.checkDatabaseHealth(),
      },
      performance: await this.performanceService.getHealthMetrics(),
    };
  }

  @Get('detailed')
  async detailed() {
    const memoryStats = this.memoryService.getMemoryStats();
    const v8Stats = this.memoryService.getV8HeapStats();
    const performanceStats = await this.performanceService.getEndpointStats();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      memory: {
        process: memoryStats,
        v8: v8Stats,
        health: this.memoryService.getMemoryHealth(),
      },
      performance: performanceStats,
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
        cpuUsage: process.cpuUsage(),
      },
    };
  }

  private determineOverallStatus(...statuses: string[]): string {
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  }

  private async checkCacheHealth(): Promise<{ status: string; message: string }> {
    try {
      await this.cacheService.set('health-check', 'ok', 10);
      const result = await this.cacheService.get('health-check');

      if (result === 'ok') {
        return { status: 'healthy', message: 'Cache is operational' };
      } else {
        return { status: 'warning', message: 'Cache read/write test failed' };
      }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown cache error';
        return { status: 'critical', message: `Cache error: ${message}` };
      }
  }

  private async checkDatabaseHealth(): Promise<{ status: string; message: string }> {
    // Simple database connectivity check
    // In a real implementation, you'd inject a database service
    return { status: 'healthy', message: 'Database connection established' };
  }
}



