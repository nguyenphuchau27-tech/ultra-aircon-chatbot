import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { getRedisClient } from '../../common/redis/redis.factory';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  async push(job: unknown) {
    const redis = getRedisClient();

    try {
      await redis.lpush('jobs', JSON.stringify(job));
      this.logger.log('Job pushed to Redis queue');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to push job to queue: ${message}`);
      throw new ServiceUnavailableException('Queue service temporarily unavailable');
    }
  }
}