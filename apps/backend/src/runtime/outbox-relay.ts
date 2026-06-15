import { Effect } from "effect";
import type { Kysely } from "kysely";
import type { Redis } from "ioredis";
import type { DatabaseTables } from "../infra/postgres-tables.js";
import { listUnpublishedOutboxEvents, markOutboxEventPublished } from "../infra/durable-store.js";
import type { ExecutionQueue } from "./execution-queue.js";

export interface OutboxRelay {
  readonly start: () => void;
  readonly stop: () => void;
  readonly tick: () => Promise<void>;
}

export function createOutboxRelay(options: {
  readonly db: Kysely<DatabaseTables>;
  readonly redis: Redis;
  readonly queue: ExecutionQueue;
  readonly now: () => Date;
  readonly intervalMs?: number;
}): OutboxRelay {
  let timer: NodeJS.Timeout | undefined;
  let running = false;

  const tick = async () => {
    if (running) {
      return;
    }

    running = true;
    try {
      const events = await Effect.runPromise(listUnpublishedOutboxEvents(options.db, 25));
      for (const event of events) {
        if (event.eventType === "ExecutionEnqueued") {
          await options.queue.enqueue({ executionId: event.aggregateId });
        }

        await Effect.runPromise(
          markOutboxEventPublished(options.db, event.id, options.now().toISOString())
        );
      }
    } finally {
      running = false;
    }
  };

  return {
    start() {
      if (timer) {
        return;
      }

      timer = setInterval(() => {
        void tick();
      }, options.intervalMs ?? 250);
      void tick();
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    },
    tick
  };
}
