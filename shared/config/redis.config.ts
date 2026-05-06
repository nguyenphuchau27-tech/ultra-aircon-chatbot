import { createClient } from 'redis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || '6379';

export const redisClient = createClient({
  url: `redis://${redisHost}:${redisPort}`,
});

redisClient.on('connect', () => {
  console.log('✅ Redis connecting...');
});

redisClient.on('ready', () => {
  console.log('🚀 Redis ready');
});

redisClient.on('error', err => {
  console.error('❌ Redis error:', err);
});

redisClient.on('reconnecting', () => {
  console.log('♻️ Redis reconnecting...');
});

let isConnected = false;

export async function connectRedis() {
  if (isConnected) return;

  try {
    await redisClient.connect();
    isConnected = true;
    console.log('✅ Redis connected');
  } catch (error) {
    console.error('❌ Redis connection failed', error);
  }
}
