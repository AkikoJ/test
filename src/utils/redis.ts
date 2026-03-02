import { config } from '../config.js';

/**
 * Parse REDIS_URL into connection options compatible with both ioredis and BullMQ.
 * Supports rediss:// (TLS) and redis:// (plain) schemes.
 */
export function parseRedisUrl() {
  const url = new URL(config.redis.url);
  const useTls = url.protocol === 'rediss:';

  return {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    password: url.password || undefined,
    username: url.username !== 'default' ? url.username : undefined,
    ...(useTls ? { tls: {} } : {}),
  };
}

/**
 * BullMQ requires maxRetriesPerRequest: null and enableReadyCheck: false
 * for compatibility with cloud Redis providers.
 */
export function bullmqConnection() {
  return {
    ...parseRedisUrl(),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}
