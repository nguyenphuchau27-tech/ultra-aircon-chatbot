import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis?: Redis;
  private readonly defaultTTL = 300; // 5 minutes default TTL

  onModuleInit() {
    console.log('✅ Redis connecting...');

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: Number(process.env.REDIS_DB) || 0,
      lazyConnect: true,
    });

    this.redis.on('ready', () => {
      console.log('🚀 Redis ready');
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis connected');
    });

    this.redis.on('error', (error) => {
      if (process.env.NODE_ENV !== 'test') {
        console.error('❌ Redis error:', error);
      }
    });
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }

  private isRedisReady(): boolean {
    return !!this.redis;
  }

  async get(key: string): Promise<string | null> {
    if (!this.isRedisReady()) {
      return null;
    }

    try {
      return await this.redis!.get(key);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error(`Cache get error for key ${key}:`, error);
      }
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    if (!this.isRedisReady()) {
      return;
    }

    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      await this.redis!.setex(key, ttl, data);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error(`Cache get error for key ${key}:`, error);
      }
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isRedisReady()) {
      return;
    }

    try {
      await this.redis!.del(key);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error(`Cache get error for key ${key}:`, error);
      }
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.isRedisReady()) {
      return;
    }

    try {
      const keys = await this.redis!.keys(pattern);
      if (keys.length > 0) {
        await this.redis!.del(...keys);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error(`Cache delPattern error for pattern ${pattern}:`, error);
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isRedisReady()) {
      return false;
    }

    try {
      const result = await this.redis!.exists(key);
      return result === 1;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error(`Cache get error for key ${key}:`, error);
      }
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<T> {
    if (!this.isRedisReady()) {
      return await factory();
    }

    const cached = await this.get(key);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        return cached as T;
      }
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async incr(key: string): Promise<number> {
    if (!this.isRedisReady()) {
      return 0;
    }

    try {
      return await this.redis!.incr(key);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error(`Cache get error for key ${key}:`, error);
      }
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    if (!this.isRedisReady()) {
      return;
    }

    try {
      await this.redis!.expire(key, ttl);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error(`Cache get error for key ${key}:`, error);
      }
    }
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    if (!this.isRedisReady()) {
      return new Array(keys.length).fill(null);
    }

    try {
      return await this.redis!.mget(...keys);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Cache mget error:', error);
      }
      return new Array(keys.length).fill(null);
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttl: number = this.defaultTTL): Promise<void> {
    if (!this.isRedisReady()) {
      return;
    }

    try {
      const pipeline = this.redis!.pipeline();

      for (const [key, value] of Object.entries(keyValuePairs)) {
        const data = typeof value === 'string' ? value : JSON.stringify(value);
        pipeline.setex(key, ttl, data);
      }

      await pipeline.exec();
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Cache mset error:', error);
      }
    }
  }
}