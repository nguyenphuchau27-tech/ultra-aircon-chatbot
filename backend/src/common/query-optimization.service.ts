import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import type { UnaryFunction } from 'rxjs';
import { CacheService } from '../modules/cache/cache.service';

@Injectable()
export class QueryOptimizationService {
  private readonly cacheService: CacheService;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  /**
   * Apply pagination with optimized query
   */
  applyPagination<T>(
    queryBuilder: SelectQueryBuilder<T>,
    page: number = 1,
    limit: number = 10,
  ): SelectQueryBuilder<T> {
    const offset = (page - 1) * limit;
    return queryBuilder.skip(offset).take(limit);
  }

  /**
   * Apply selective field loading for performance
   */
  applyFieldSelection<T>(
    queryBuilder: SelectQueryBuilder<T>,
    fields: string[],
  ): SelectQueryBuilder<T> {
    return queryBuilder.select(fields);
  }

  /**
   * Cache query results with automatic cache key generation
   */
  async cachedQuery<T>(cacheKey: string, queryFn: () => Promise<T>, ttl: number = 300): Promise<T> {
    return this.cacheService.getOrSet(cacheKey, queryFn, ttl);
  }

  /**
   * Generate cache key from query parameters
   */
  generateCacheKey(baseKey: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');

    return `${baseKey}:${sortedParams}`;
  }

  /**
   * Execute query with performance monitoring
   */
  async executeWithMonitoring<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      }

      return result;
    } 
    catch (error) {
      const duration = Date.now() - startTime;

      if (process.env.NODE_ENV !== 'test') {
        console.error(`Query failed: ${queryName} after ${duration}ms`, error);
      }

      throw error;
    }
  }

  /**
   * Batch load related entities efficiently
   */
  async batchLoad<T>(
    ids: number[],
    repository: Repository<any>,
    relations: string[] = [],
    chunkSize: number = 100,
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const chunkResults = await repository.find({
        where: { id: chunk as any },
        relations,
      });
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Process items in batches for memory efficiency
   */
  async processBatch<T, R>(
    items: T[],
    processor: UnaryFunction<T, Promise<R>>,
    batchSize: number = 10,
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
    }

    return results;
  }
}




