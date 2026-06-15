import { Effect } from "effect";
import type { Kysely } from "kysely";
import type { RunResponse } from "@my-ai-orchestrator/contracts";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import { BackendExecutionConflictError } from "../http/errors.js";
import { findExecutionIdempotency, upsertExecutionIdempotency } from "../infra/durable-store.js";
import { getPostgresDatabase } from "../infra/postgres-client.js";
import type { DatabaseTables } from "../infra/postgres-tables.js";

export interface ExecutionIdempotencyEntry {
  readonly fingerprint: string;
  readonly response: RunResponse;
}

export interface ExecutionIdempotencyStore {
  readonly find: (
    userId: string,
    idempotencyKey: string,
    fingerprint: string
  ) => Effect.Effect<RunResponse | undefined, BackendExecutionConflictError>;
  readonly save: (
    userId: string,
    idempotencyKey: string,
    fingerprint: string,
    response: RunResponse,
    executionId?: string
  ) => Effect.Effect<void, never>;
}

function conflict(idempotencyKey: string) {
  return new BackendExecutionConflictError({
    idempotencyKey,
    message: `Idempotency key "${idempotencyKey}" was already used for a different execution`
  });
}

export function createInMemoryExecutionIdempotencyStore(): ExecutionIdempotencyStore {
  const cache = new Map<string, ExecutionIdempotencyEntry>();

  return {
    find(userId, idempotencyKey, fingerprint) {
      const cached = cache.get(`${userId}:${idempotencyKey}`);
      if (!cached) {
        return Effect.succeed(undefined);
      }

      if (cached.fingerprint !== fingerprint) {
        return Effect.fail(conflict(idempotencyKey));
      }

      return Effect.succeed(cached.response);
    },
    save(userId, idempotencyKey, fingerprint, response) {
      cache.set(`${userId}:${idempotencyKey}`, { fingerprint, response });
      return Effect.void;
    }
  };
}

export function createPostgresExecutionIdempotencyStore(
  db: Kysely<DatabaseTables>,
  now: () => Date
): ExecutionIdempotencyStore {
  return {
    find(userId, idempotencyKey, fingerprint) {
      return Effect.gen(function* () {
        const cached = yield* findExecutionIdempotency(db, userId, idempotencyKey).pipe(
          Effect.catchAll(() => Effect.succeed(undefined))
        );

        if (!cached) {
          return undefined;
        }

        if (cached.fingerprint !== fingerprint) {
          return yield* Effect.fail(conflict(idempotencyKey));
        }

        return cached.response as RunResponse;
      });
    },
    save(userId, idempotencyKey, fingerprint, response, executionId) {
      return upsertExecutionIdempotency(db, {
        userId,
        idempotencyKey,
        fingerprint,
        executionId: executionId ?? ("jobId" in response ? String(response.jobId) : userId),
        response,
        createdAt: now().toISOString()
      }).pipe(Effect.catchAll(() => Effect.void));
    }
  };
}

export function resolveExecutionIdempotencyStore(options: {
  readonly runtimeMode?: "durable" | "memory";
  readonly rawDatabase: DatabaseClient;
  readonly now: () => Date;
  readonly idempotencyStore?: ExecutionIdempotencyStore;
}): ExecutionIdempotencyStore {
  if (options.idempotencyStore) {
    return options.idempotencyStore;
  }

  if (options.runtimeMode === "durable") {
    const postgres = getPostgresDatabase(options.rawDatabase);
    if (!postgres) {
      throw new Error("Durable execution idempotency requires PostgreSQL");
    }

    return createPostgresExecutionIdempotencyStore(postgres, options.now);
  }

  return createInMemoryExecutionIdempotencyStore();
}
