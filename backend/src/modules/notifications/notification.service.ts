import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { getRedisClient } from '../../common/redis/redis.factory';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendPushNotification(userId: number | string, title: string, message: string) {
    const redis = getRedisClient();

    try {
      await redis.publish(
        'notifications',
        JSON.stringify({
          userId,
          title,
          message,
          createdAt: new Date().toISOString(),
        }),
      );

      this.logger.log(`Push notification published for userId=${userId}`);
      return true;
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to publish notification: ${messageText}`);
      throw new ServiceUnavailableException('Notification service temporarily unavailable');
    }
  }

  async sendSMS(phone: string, message: string) {
    this.logger.log(`Send SMS to ${phone}`);
    void message;
    return true;
  }

  async sendEmail(email: string, subject: string, message: string) {
    this.logger.log(`Send email to ${email} with subject=${subject}`);
    void message;
    return true;
  }
}