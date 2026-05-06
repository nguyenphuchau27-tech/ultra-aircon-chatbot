import { Injectable } from '@nestjs/common';

/**
 * Base Domain Event (chuẩn DDD)
 */
export interface DomainEvent {
  eventName: string;
  occurredAt: Date;
  payload?: unknown;
}

/**
 * Event Publisher Contract
 * -> Sau này thay bằng Kafka / Redis / RabbitMQ dễ dàng
 */
export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: DomainEvent[]): Promise<void>;
}

/**
 * In-memory implementation (dev/test only)
 */
@Injectable()
export class InMemoryEventPublisher implements EventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    console.log(`[Event] ${event.eventName}`, {
      occurredAt: event.occurredAt,
      payload: event.payload,
    });
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map(e => this.publish(e)));
  }
}



