import { Injectable } from '@nestjs/common';
import { CacheService } from '../modules/cache/cache.service';

export interface LoadBalancerConfig {
  algorithm: 'round-robin' | 'least-connections' | 'ip-hash';
  nodes: string[];
  healthCheckInterval: number;
}

@Injectable()
export class ScalabilityService {
  private readonly instanceId = process.env.INSTANCE_ID || `instance-${Date.now()}`;
  private readonly maxConcurrentRequests = Number(process.env.MAX_CONCURRENT_REQUESTS) || 100;
  private currentRequests = 0;
  private readonly cacheService: CacheService;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
    this.registerInstance();
    this.startHealthReporting();
  }

  async registerInstance(): Promise<void> {
    const instanceData = {
      id: this.instanceId,
      host: process.env.HOST || 'localhost',
      port: process.env.PORT || 3000,
      registeredAt: new Date().toISOString(),
      status: 'healthy',
      load: 0,
    };

    await this.cacheService.set(`instance:${this.instanceId}`, instanceData, 60); // 1 minute TTL
    await this.cacheService.set(`instances:${this.instanceId}`, this.instanceId, 60);
  }

  async getActiveInstances(): Promise<string[]> {
    try {
      // Get all instance keys
      const instanceKeys = await this.cacheService.mget(['instances:*']);
      return instanceKeys.filter(key => key !== null) as string[];
    } catch {
      return [this.instanceId];
    }
  }

  async getInstanceLoad(instanceId: string): Promise<any> {
    const instanceData = await this.cacheService.get(`instance:${instanceId}`);
    return instanceData ? JSON.parse(instanceData) : null;
  }

  async selectInstance(
    algorithm: 'round-robin' | 'least-loaded' = 'least-loaded',
  ): Promise<string> {
    const instances = await this.getActiveInstances();

    if (instances.length === 0) {
      return this.instanceId;
    }

    if (instances.length === 1) {
      return instances[0];
    }

    switch (algorithm) {
      case 'round-robin':
        return this.selectRoundRobin(instances);
      case 'least-loaded':
      default:
        return this.selectLeastLoaded(instances);
    }
  }

  private async selectRoundRobin(instances: string[]): Promise<string> {
    const key = 'load-balancer:round-robin-index';
    const currentIndex = (await this.cacheService.get(key)) || '0';
    const index = (parseInt(currentIndex) + 1) % instances.length;

    await this.cacheService.set(key, index.toString(), 300);
    return instances[index];
  }

  private async selectLeastLoaded(instances: string[]): Promise<string> {
    let selectedInstance = instances[0];
    let minLoad = Infinity;

    for (const instanceId of instances) {
      const instanceData = await this.getInstanceLoad(instanceId);
      if (instanceData && instanceData.load < minLoad) {
        minLoad = instanceData.load;
        selectedInstance = instanceId;
      }
    }

    return selectedInstance;
  }

  async updateLoad(load: number): Promise<void> {
    const instanceData = await this.cacheService.get(`instance:${this.instanceId}`);
    if (instanceData) {
      const data = JSON.parse(instanceData);
      data.load = load;
      data.lastUpdated = new Date().toISOString();

      await this.cacheService.set(`instance:${this.instanceId}`, data, 60);
    }
  }

  async incrementRequestCount(): Promise<boolean> {
    // Check if we're at capacity before incrementing
    if (this.currentRequests >= this.maxConcurrentRequests) {
      await this.updateLoad(1); // Mark as fully loaded
      return false; // Reject request
    }

    this.currentRequests++;
    await this.updateLoad(this.currentRequests / this.maxConcurrentRequests);
    return true; // Accept request
  }

  async decrementRequestCount(): Promise<void> {
    this.currentRequests = Math.max(0, this.currentRequests - 1);
    await this.updateLoad(this.currentRequests / this.maxConcurrentRequests);
  }

  private startHealthReporting(): void {
    globalThis.setInterval(async () => {
      await this.updateLoad(this.currentRequests / this.maxConcurrentRequests);
    }, 10000); // Update every 10 seconds
  }

  async getClusterStats(): Promise<any> {
    const instances = await this.getActiveInstances();
    const instanceStats = [];

    for (const instanceId of instances) {
      const data = await this.getInstanceLoad(instanceId);
      if (data) {
        instanceStats.push(data);
      }
    }

    return {
      totalInstances: instances.length,
      activeInstances: instanceStats.length,
      averageLoad: instanceStats.reduce((sum, inst) => sum + inst.load, 0) / instanceStats.length,
      instances: instanceStats,
      currentInstance: {
        id: this.instanceId,
        load: this.currentRequests / this.maxConcurrentRequests,
        currentRequests: this.currentRequests,
        maxRequests: this.maxConcurrentRequests,
      },
    };
  }

  // Circuit breaker pattern for external service calls
  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    serviceName: string,
    failureThreshold: number = 5,
    recoveryTimeout: number = 60000,
  ): Promise<T> {
    const circuitKey = `circuit:${serviceName}`;
    const failureKey = `failures:${serviceName}`;

    // Check if circuit is open
    const circuitState = await this.cacheService.get(circuitKey);
    if (circuitState === 'open') {
      throw new Error(`Circuit breaker is open for ${serviceName}`);
    }

    try {
      const result = await operation();

      // Reset failure count on success
      await this.cacheService.del(failureKey);
      await this.cacheService.set(circuitKey, 'closed', 300);

      return result;
    } catch (error) {
      // Increment failure count
      const failures = (await this.cacheService.incr(failureKey)) - 1;

      if (failures >= failureThreshold) {
        // Open circuit
        await this.cacheService.set(circuitKey, 'open', recoveryTimeout / 1000);
        console.warn(`Circuit breaker opened for ${serviceName} after ${failures} failures`);
      }

      throw error;
    }
  }
}



