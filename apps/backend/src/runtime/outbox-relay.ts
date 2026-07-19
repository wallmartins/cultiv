import { Effect } from "effect";
import type { Kysely } from "kysely";
import type { Redis } from "ioredis";
import type { DatabaseTables } from "../infra/postgres-tables.js";
import { listUnpublishedOutboxEvents, markOutboxEventPublished } from "../infra/durable-store.js";
import type { Auth0ManagementClient } from "../auth/auth0-management-client.js";
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
  // contract-08 §5 task 5 — optional: account.auth0-delete events are only published when
  // configured (AUTH0_MANAGEMENT_*); without it they stay queued, which is the honest state.
  readonly auth0Management?: Auth0ManagementClient;
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
      if (events.length > 0) {
        console.info("Outbox relay processing unpublished events", { count: events.length });
      }
      for (const event of events) {
        if (event.eventType === "ExecutionEnqueued") {
          await options.queue.enqueue({ executionId: event.aggregateId });
        }

        if (event.eventType === "account.auth0-delete") {
          if (!options.auth0Management) {
            console.warn("Skipping account.auth0-delete: Auth0 Management client is not configured", {
              aggregateId: event.aggregateId
            });
            continue;
          }

          const externalSubject = event.payload.externalSubject;
          if (typeof externalSubject !== "string") {
            console.error("Skipping malformed account.auth0-delete event", { aggregateId: event.aggregateId });
            continue;
          }

          // failure here leaves published_at null, so the same event is retried next tick — this
          // IS the durable retry (decision 5), no separate backoff/idempotency table needed since
          // deleteUser treats a 404 (already gone) as success.
          const result = await Effect.runPromiseExit(options.auth0Management.deleteUser(externalSubject));
          if (result._tag === "Failure") {
            console.error("account.auth0-delete failed, will retry", {
              aggregateId: event.aggregateId,
              cause: result.cause
            });
            continue;
          }
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
