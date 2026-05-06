import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('CacheService', () => {
  let service: CacheService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
    mockRedis = new Redis() as jest.Mocked<Redis>;

    // Create a simple in-memory store for testing
    const store = new Map<string, string>();

    // Mock Redis methods with actual storage simulation
    mockRedis.get.mockImplementation(async (key: string) => {
      return store.get(key) || null;
    });
    mockRedis.setex.mockImplementation(async (key: string, ttl: number, value: string) => {
      store.set(key, value);
      return 'OK';
    });
    mockRedis.del.mockImplementation(async (...keys: any[]) => {
      let deleted = 0;
      for (const key of keys) {
        if (store.delete(key)) deleted++;
      }
      return deleted;
    });
    mockRedis.exists.mockImplementation(async (key: any) => {
      return store.has(key) ? 1 : 0;
    });
    mockRedis.keys.mockImplementation(async (pattern: any) => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return Array.from(store.keys()).filter(key => regex.test(key));
    });
    mockRedis.scan.mockResolvedValue(['0', []]);
    mockRedis.incr.mockImplementation(async (key: string) => {
      const current = parseInt(store.get(key) || '0');
      const next = current + 1;
      store.set(key, next.toString());
      return next;
    });

    // Replace the redis instance
    (service as any).redis = mockRedis;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get a value', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await service.set(key, value);
      const result = await service.get(key);

      expect(result).toBe(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await service.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete a key', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await service.set(key, value);
      await service.del(key);
      const result = await service.get(key);

      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await service.set(key, value);
      const exists = await service.exists(key);

      expect(exists).toBe(true);

      await service.del(key);
      const notExists = await service.exists(key);

      expect(notExists).toBe(false);
    });
  });

  describe('TTL Functionality', () => {
    it.skip('should set value with TTL', async () => {
      const key = 'ttl-key';
      const value = 'ttl-value';
      const ttl = 1; // 1 second

      await service.set(key, value, ttl);
      const result = await service.get(key);

      expect(result).toBe(value);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const expiredResult = await service.get(key);
      expect(expiredResult).toBeNull();
    });
  });

  describe('Advanced Operations', () => {
    it('should increment a counter', async () => {
      const key = 'counter';

      const result1 = await service.incr(key);
      expect(result1).toBe(1);

      const result2 = await service.incr(key);
      expect(result2).toBe(2);
    });

    it('should handle getOrSet functionality', async () => {
      const key = 'get-or-set-key';
      const factoryValue = 'factory-value';

      const result = await service.getOrSet(key, async () => factoryValue, 60);

      expect(result).toBe(factoryValue);

      // Second call should return cached value
      const cachedResult = await service.getOrSet(key, async () => 'new-value', 60);

      expect(cachedResult).toBe(factoryValue);
    });
  });

  describe('Pattern Operations', () => {
    it('should delete keys by pattern', async () => {
      const pattern = 'pattern-test:*';

      await service.set('pattern-test:1', 'value1');
      await service.set('pattern-test:2', 'value2');
      await service.set('other-key', 'value3');

      await service.delPattern(pattern);

      const result1 = await service.get('pattern-test:1');
      const result2 = await service.get('pattern-test:2');
      const result3 = await service.get('other-key');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBe('value3');
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Mock Redis to throw error
      jest.spyOn(service['redis'], 'get').mockRejectedValue(new Error('Connection failed'));

      const result = await service.get('test-key');
      expect(result).toBeNull();
    });

    it('should handle set errors gracefully', async () => {
      jest.spyOn(service['redis'], 'setex').mockRejectedValue(new Error('Set failed'));

      // Should not throw
      await expect(service.set('test-key', 'value')).resolves.not.toThrow();
    });
  });
});



