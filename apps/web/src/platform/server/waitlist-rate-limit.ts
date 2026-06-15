const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

const memoryStore = new Map<string, { readonly count: number; readonly resetAt: number }>();

export async function assertWaitlistRateLimit(key: string): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
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

    return;
  }

  if (process.env.WAITLIST_ALLOW_IN_MEMORY_RATE_LIMIT === "true") {
    const now = Date.now();
    const current = memoryStore.get(key);

    if (!current || current.resetAt <= now) {
      memoryStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return;
    }

    if (current.count >= RATE_LIMIT_MAX) {
      throw new Error("rate_limited");
    }

    memoryStore.set(key, { count: current.count + 1, resetAt: current.resetAt });
    return;
  }

  throw new Error("REDIS_URL is required for waitlist rate limiting");
}
