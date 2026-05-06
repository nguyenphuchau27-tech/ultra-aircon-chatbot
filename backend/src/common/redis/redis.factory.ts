import Redis from 'ioredis';

let redisClient: Redis | null = null;
let listenersBound = false;

function buildRedisClient(): Redis {
  const host = process.env.REDIS_HOST || 'redis';
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD || undefined;
  const db = Number(process.env.REDIS_DB || 0);

  return new Redis({
    host,
    port,
    password,
    db,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times) {
      return Math.min(times * 200, 2000);
    },
  });
}

function bindListeners(client: Redis) {
  if (listenersBound) return;
  listenersBound = true;

  client.on('connect', () => {
    console.log(`[Redis] connected to ${client.options.host}:${client.options.port}`);
  });

  client.on('ready', () => {
    console.log('[Redis] ready');
  });

  client.on('reconnecting', () => {
    console.log('[Redis] reconnecting...');
  });

  client.on('error', (error) => {
    console.error('[Redis] error:', error.message);
  });

  client.on('close', () => {
    console.warn('[Redis] connection closed');
  });

  client.on('end', () => {
    console.warn('[Redis] connection ended');
  });
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = buildRedisClient();
    bindListeners(redisClient);
  }

  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (!redisClient) return;

  const client = redisClient;
  redisClient = null;
  listenersBound = false;

  try {
    await client.quit();
  } catch {
    client.disconnect();
  }
}