import { Injectable } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class OrderJobService {
  private readonly queue: QueueService;

  constructor(queue: QueueService) {
    this.queue = queue;
  }

  async processOrder(order) {
    await this.queue.send('order_queue', order);
  }
}



