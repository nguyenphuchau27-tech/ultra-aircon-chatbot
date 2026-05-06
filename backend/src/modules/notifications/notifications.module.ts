import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { QueueService } from './queue.service';

@Module({
  providers: [NotificationService, QueueService],
  exports: [NotificationService, QueueService],
})
export class NotificationsModule {}