import { Effect } from "effect";
import type { Redis } from "ioredis";
import { rateLimitRedisKey } from "../infra/redis-client.js";

export interface RateLimitStore {
  readonly increment: (
    key: string,
    windowMs: number,
    nowMs: number
  ) => Effect.Effect<{ readonly count: number; readonly resetAt: number }, never>;
}

export function createRedisRateLimitStore(redis: Redis): RateLimitStore {
  return {
    increment(key, windowMs, nowMs) {
      return Effect.tryPromise({
        try: async () => {
          const redisKey = rateLimitRedisKey(key);
          const count = await redis.incr(redisKey);
          if (count === 1) {
            await redis.pexpire(redisKey, windowMs);
          }

          const ttl = await redis.pttl(redisKey);
          return {
            count,
            resetAt: nowMs + (ttl > 0 ? ttl : windowMs)
          };
        },
        catch: () => ({
          count: 1,
          resetAt: nowMs + windowMs
        })
      }).pipe(Effect.catchAll(() => Effect.succeed({ count: 1, resetAt: nowMs + windowMs })));
    }
  };
}

export function createRedisTrafficLimitStore(redis: Redis) {
  return {
    increment(key: string, ttlMs: number) {
      return Effect.tryPromise({
        try: async () => {
          const redisKey = `traffic:${key}`;
          const count = await redis.incr(redisKey);
          if (count === 1) {
            await redis.pexpire(redisKey, ttlMs);
          }
          return count;
        },
        catch: () => 1
      }).pipe(Effect.catchAll(() => Effect.succeed(1)));
    }
  };
}
