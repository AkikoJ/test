import { Redis } from 'ioredis';
import { config } from '../config.js';

const redis = new Redis(config.redis.url);

/**
 * Simple sliding-window rate limiter using Redis.
 * Returns true if the request should be allowed, false if rate-limited.
 */
export async function checkRateLimit(
  key: string,
  maxRequests = 10,
  windowSeconds = 60,
): Promise<boolean> {
  const redisKey = `rate:${key}`;
  const current = await redis.incr(redisKey);

  if (current === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  return current <= maxRequests;
}
