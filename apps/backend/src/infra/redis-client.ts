import { Redis } from "ioredis";
import type { BackendConfig } from "../config/config.js";

let sharedRedis: Redis | undefined;

export function createRedisClient(config: BackendConfig): Redis {
  if (!config.redisUrl) {
    throw new Error("REDIS_URL is required for durable runtime");
  }

  return new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false
  });
}

export function getSharedRedisClient(config: BackendConfig): Redis {
  if (!sharedRedis) {
    sharedRedis = createRedisClient(config);
  }
  return sharedRedis;
}

export async function resetSharedRedisClientForTests(): Promise<void> {
  if (!sharedRedis) {
    return;
  }

  const client = sharedRedis;
  sharedRedis = undefined;
  client.on("error", () => undefined);
  client.disconnect();
}

export function executionEventChannel(executionId: string): string {
  return `execution:${executionId}:events`;
}

export function rateLimitRedisKey(key: string): string {
  return `rate-limit:${key}`;
}

export function trafficLimitRedisKey(key: string): string {
  return `traffic-limit:${key}`;
}

// contract-08 decision 8 — best-effort pre-purge hygiene for reset/delete. Rate/traffic-limit keys
// are the only durable per-user Redis state in this codebase (calibration sessions live in Postgres
// `memories`, already covered by memories.removeByUser; SSE is a pub/sub channel, nothing to flush).
// These keys are also TTL-bound and inert once the account is tombstoned/gone, so a scan failure
// here is non-fatal — swallowed by the caller.
export async function flushUserRedisKeys(redis: Redis, userId: string): Promise<void> {
  const pattern = `*${userId}*`;
  let cursor = "0";
  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== "0");
}
