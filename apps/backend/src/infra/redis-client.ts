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
