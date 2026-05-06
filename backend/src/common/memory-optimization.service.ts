import { Injectable } from '@nestjs/common';
import * as os from 'os';
import * as v8 from 'v8';
import type { UnaryFunction } from 'rxjs';

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  systemFree: number;
  systemTotal: number;
  heapUsagePercent: number;
  timestamp: Date;
}

@Injectable()
export class MemoryOptimizationService {
  private readonly memoryThreshold = 0.8; // 80% heap usage threshold
  private readonly gcInterval = 5 * 60 * 1000; // 5 minutes
  private gcTimer: ReturnType<typeof globalThis.setInterval> | null = null;

  constructor() {
    this.startGCTimer();
  }

  getMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      systemFree: freeMem,
      systemTotal: totalMem,
      heapUsagePercent: memUsage.heapUsed / memUsage.heapTotal,
      timestamp: new Date(),
    };
  }

  isMemoryCritical(): boolean {
    const stats = this.getMemoryStats();
    return stats.heapUsagePercent > this.memoryThreshold;
  }

  forceGarbageCollection(): void {
    // Only run GC if available and not in test environment
    if (global.gc && process.env.NODE_ENV !== 'test') {
      global.gc();
      console.log('🗑️ Manual garbage collection triggered');
    } else if (process.env.NODE_ENV !== 'test') {
      console.warn('Manual GC not available. Run with --expose-gc flag');
    }
    // In test environment, just log without warning
  }

  optimizeMemory(): void {
    const stats = this.getMemoryStats();

    if (stats.heapUsagePercent > this.memoryThreshold) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`High memory usage detected: ${(stats.heapUsagePercent * 100).toFixed(1)}%`);
      }
      this.forceGarbageCollection();
    }
  }

  private startGCTimer(): void {
    this.gcTimer = globalThis.setInterval(() => {
      this.optimizeMemory();
    }, this.gcInterval);
  }

  stopGCTimer(): void {
    if (this.gcTimer) {
      globalThis.clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
  }

  getV8HeapStats(): any {
    try {
      return v8.getHeapStatistics();
    } catch (error) {
      console.error('Failed to get V8 heap stats:', error);
      return null;
    }
  }

  getMemoryHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    stats: MemoryStats;
  } {
    const stats = this.getMemoryStats();
    const heapPercent = stats.heapUsagePercent;

    let status: 'healthy' | 'warning' | 'critical';
    let message: string;

    if (heapPercent > 0.9) {
      status = 'critical';
      message = `Critical memory usage: ${(heapPercent * 100).toFixed(1)}%`;
    } else if (heapPercent > 0.8) {
      status = 'warning';
      message = `High memory usage: ${(heapPercent * 100).toFixed(1)}%`;
    } else {
      status = 'healthy';
      message = `Memory usage normal: ${(heapPercent * 100).toFixed(1)}%`;
    }

    return { status, message, stats };
  }

  // Memory-efficient batch processing
  async processBatch<T, R>(
    items: T[],
    processor: UnaryFunction<T, Promise<R>>,
    batchSize: number = 10,
    delayBetweenBatches: number = 100,
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      // Process batch
      const batchResults = await Promise.all(batch.map(item => processor(item)));

      results.push(...batchResults);

      // Force GC check after each batch
      this.optimizeMemory();

      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < items.length) {
        await new Promise(resolve => globalThis.setTimeout(resolve, delayBetweenBatches));
      }
    }

    return results;
  }

  // Memory-efficient streaming for large datasets
  async *streamProcess<T, R>(
    generator: AsyncGenerator<T>,
    processor: UnaryFunction<T, Promise<R>>,
    batchSize: number = 5,
  ): AsyncGenerator<R> {
    let batch: T[] = [];

    for await (const item of generator) {
      batch.push(item);

      if (batch.length >= batchSize) {
        // Process batch
        const results = await Promise.all(batch.map(item => processor(item)));

        // Yield results
        for (const result of results) {
          yield result;
        }

        // Clear batch and check memory
        batch = [];
        this.optimizeMemory();
      }
    }

    // Process remaining items
    if (batch.length > 0) {
      const results = await Promise.all(batch.map(item => processor(item)));

      for (const result of results) {
        yield result;
      }
    }
  }
}




