const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function assertWaitlistRateLimit(key: string): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is required for waitlist rate limiting");
  }

  const { default: Redis } = await import("ioredis");
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
  await redis.connect();

  try {
    const redisKey = `waitlist:rate-limit:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.pexpire(redisKey, RATE_LIMIT_WINDOW_MS);
    }

    if (count > RATE_LIMIT_MAX) {
      throw new Error("rate_limited");
    }
  } finally {
    await redis.quit();
  }
}
