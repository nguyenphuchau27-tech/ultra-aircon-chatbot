import { Injectable } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class QueueService {
  private channel;

  async connect() {
    const conn = await amqp.connect('amqp://rabbitmq');

    this.channel = await conn.createChannel();
  }

  async send(queue, data) {
    await this.channel.assertQueue(queue);

    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
  }
}



