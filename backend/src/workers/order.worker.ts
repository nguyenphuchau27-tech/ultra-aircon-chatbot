import * as amqp from 'amqplib';
import { Queue } from 'bullmq';

const orderQueue = new Queue('orders', {
  connection: {
    host: 'redis',
    port: 6379,
  },
});

async function start() {
  const conn = await amqp.connect('amqp://rabbitmq');
  const channel = await conn.createChannel();

  await channel.assertQueue('order_queue');

  channel.consume('order_queue', async msg => {
    const order = JSON.parse(msg.content.toString());

    console.log('Received order', order);

    // push job vào BullMQ
    await orderQueue.add('process-order', order);

    channel.ack(msg);
  });
}

start();



