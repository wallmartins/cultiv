import type { Redis } from "ioredis";
import type { BackendJobEvent } from "../jobs/job-store.js";
import { executionEventChannel } from "../infra/redis-client.js";

export async function publishExecutionEvent(redis: Redis, event: BackendJobEvent): Promise<void> {
  await redis.publish(executionEventChannel(event.jobId), JSON.stringify(event));
}

export function subscribeExecutionEvents(
  redis: Redis,
  executionId: string,
  listener: (event: BackendJobEvent) => void
): Redis {
  const subscriber = redis.duplicate();
  const channel = executionEventChannel(executionId);

  subscriber.on("error", () => undefined);
  void subscriber.subscribe(channel).catch(() => undefined);
  subscriber.on("message", (incomingChannel, message) => {
    if (incomingChannel !== channel) {
      return;
    }

    try {
      listener(JSON.parse(message) as BackendJobEvent);
    } catch {
      return;
    }
  });

  return subscriber;
}

export function closeExecutionEventSubscriber(
  subscriber: Redis,
  executionId?: string
): void {
  subscriber.removeAllListeners("message");

  if (executionId && subscriber.status === "ready") {
    void subscriber.unsubscribe(executionEventChannel(executionId)).catch(() => undefined);
  }

  subscriber.on("error", () => undefined);
  subscriber.disconnect();
}

export async function listPersistedExecutionEvents(
  redis: Redis,
  executionId: string
): Promise<readonly BackendJobEvent[]> {
  const raw = await redis.lrange(`execution:${executionId}:event-log`, 0, -1);
  return raw.map((entry) => JSON.parse(entry) as BackendJobEvent);
}

export async function appendPersistedExecutionEvent(redis: Redis, event: BackendJobEvent): Promise<void> {
  const key = `execution:${event.jobId}:event-log`;
  await redis.rpush(key, JSON.stringify(event));
  await redis.expire(key, 60 * 60 * 24);
  await publishExecutionEvent(redis, event);
}
