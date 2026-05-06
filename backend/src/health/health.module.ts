import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CommonModule } from '../common/common.module';
import { CacheModule } from '../modules/cache/cache.module';

@Module({
  imports: [CommonModule, CacheModule],
  controllers: [HealthController],
})
export class HealthModule {}