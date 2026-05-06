import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../modules/cache/cache.service';

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date | string | number;
  userAgent?: string;
  ip?: string;
}

type EndpointStats = {
  count: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  slowRequests: number;
};

@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  private readonly metricsWindow = 1000 * 60 * 5; // 5 minutes
  private readonly slowQueryThreshold = 1000; // 1 second

  constructor(private readonly cacheService: CacheService) {}

  async recordMetric(metric: PerformanceMetrics): Promise<void> {
    try {
      const key = this.buildMetricKey(metric.endpoint, metric.method);
      const metrics = await this.getMetricsForEndpoint(metric.endpoint, metric.method);

      const normalizedMetric: PerformanceMetrics = {
        ...metric,
        timestamp: new Date().toISOString(),
      };

      metrics.push(normalizedMetric);

      const recentMetrics = metrics.filter((m) => {
        const metricTime = this.normalizeTimestamp(m.timestamp).getTime();
        return Date.now() - metricTime < this.metricsWindow;
      });

      await this.cacheService.set(key, recentMetrics, 300);

      if (metric.responseTime > this.slowQueryThreshold) {
        this.logger.warn(
          `Slow API response: ${metric.method} ${metric.endpoint} - ${metric.responseTime}ms`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to record performance metric: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async getMetricsForEndpoint(
    endpoint: string,
    method: string,
  ): Promise<PerformanceMetrics[]> {
    try {
      const key = this.buildMetricKey(endpoint, method);
      const cached = await this.cacheService.get(key);

      if (!cached) {
        return [];
      }

      const parsed = JSON.parse(cached);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((item) => this.isValidMetricShape(item))
        .map((item) => ({
          endpoint: item.endpoint,
          method: item.method,
          responseTime: Number(item.responseTime),
          statusCode: Number(item.statusCode),
          timestamp: item.timestamp,
          userAgent: item.userAgent,
          ip: item.ip,
        }));
    } catch (error) {
      this.logger.warn(
        `Failed to read metrics for ${method} ${endpoint}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  async getAverageResponseTime(endpoint: string, method: string): Promise<number> {
    const metrics = await this.getMetricsForEndpoint(endpoint, method);

    if (metrics.length === 0) {
      return 0;
    }

    const total = metrics.reduce((sum, m) => sum + Number(m.responseTime || 0), 0);
    return Math.round(total / metrics.length);
  }

  async getEndpointStats(): Promise<Record<string, EndpointStats>> {
    const cacheKey = 'perf:stats:summary';

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const perfKeys = await this.getAllPerformanceKeys();
        const values = await this.cacheService.mget(perfKeys);
        const stats: Record<string, EndpointStats> = {};

        values.forEach((data, index) => {
          if (!data) {
            return;
          }

          try {
            const metrics: PerformanceMetrics[] = JSON.parse(data);

            if (!Array.isArray(metrics) || metrics.length === 0) {
              return;
            }

            const endpointKey = perfKeys[index] ?? `endpoint_${index}`;
            const responseTimes = metrics.map((m) => Number(m.responseTime || 0));

            stats[endpointKey] = {
              count: metrics.length,
              avgResponseTime: this.safeAverage(responseTimes),
              minResponseTime: Math.min(...responseTimes),
              maxResponseTime: Math.max(...responseTimes),
              p95ResponseTime: this.calculatePercentile(responseTimes, 95),
              errorRate:
                metrics.filter((m) => Number(m.statusCode) >= 400).length / metrics.length,
              slowRequests: metrics.filter(
                (m) => Number(m.responseTime) > this.slowQueryThreshold,
              ).length,
            };
          } catch (error) {
            this.logger.warn(
              `Error parsing performance metrics for key ${perfKeys[index]}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        });

        return stats;
      },
      60,
    );
  }

  async getHealthMetrics(): Promise<{
    overall: {
      totalEndpoints: number;
      averageResponseTime: number | null;
      totalRequests: number;
    };
    endpoints: Record<string, EndpointStats>;
    timestamp: string;
  }> {
    const stats = await this.getEndpointStats();
    const entries = Object.values(stats);
    const totalEndpoints = entries.length;

    return {
      overall: {
        totalEndpoints,
        averageResponseTime:
          totalEndpoints > 0
            ? this.safeAverage(entries.map((stat) => stat.avgResponseTime))
            : null,
        totalRequests: entries.reduce((sum, stat) => sum + stat.count, 0),
      },
      endpoints: stats,
      timestamp: new Date().toISOString(),
    };
  }

  private async getAllPerformanceKeys(): Promise<string[]> {
    return [
      'perf:/api/technicians:GET',
      'perf:/api/orders:GET',
      'perf:/api/orders:POST',
    ];
  }

  private buildMetricKey(endpoint: string, method: string): string {
    return `perf:${endpoint}:${method}`;
  }

  private normalizeTimestamp(value: Date | string | number): Date {
    if (value instanceof Date) {
      return value;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return new Date(0);
    }

    return parsed;
  }

  private safeAverage(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    return total / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) {
      return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }

  private isValidMetricShape(value: unknown): value is PerformanceMetrics {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const metric = value as Record<string, unknown>;

    return (
      typeof metric.endpoint === 'string' &&
      typeof metric.method === 'string' &&
      metric.responseTime !== undefined &&
      metric.statusCode !== undefined &&
      metric.timestamp !== undefined
    );
  }
}