import { Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaService {
  private kafka = new Kafka({ brokers: ['kafka:9092'] });

  private producer = this.kafka.producer();
  private consumer = this.kafka.consumer({ groupId: 'backend-group' });

  async connect() {
    await this.producer.connect();
    await this.consumer.connect();
  }

  async publish(topic: string, message: any) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async consume(topic: string, callback: (msg: any) => void) {
    await this.consumer.subscribe({ topic, fromBeginning: true });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        callback(JSON.parse(message.value.toString()));
      },
    });
  }
}


