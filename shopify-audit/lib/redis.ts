import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
  }
  return redis;
}

export async function cacheResult(jobId: string, data: unknown, ttlSeconds = 300) {
  const client = getRedisClient();
  if (!client) return;
  await client.set(`audit:${jobId}`, JSON.stringify(data), { ex: ttlSeconds });
}

export async function getCachedResult(jobId: string) {
  const client = getRedisClient();
  if (!client) return null;
  const cached = await client.get(`audit:${jobId}`);
  return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
}
