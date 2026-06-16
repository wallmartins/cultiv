import { Effect } from "effect";
import { Kysely } from "kysely";
import {
  DatabaseJobAlreadyExistsError,
  DatabaseJobNotFoundError,
  type JobCreateOptions,
  type JobRecord,
  type JobRepository
} from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";

function serializeJob(record: JobRecord) {
  return {
    id: record.id,
    data: JSON.stringify(record),
    version: record.version,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}

function parseJob(row: {
  id: string;
  data: unknown;
  version: number;
  created_at: string;
  updated_at: string;
}): JobRecord {
  const parsed = parseStoredJsonRecord<JobRecord>(row.data);
  return { ...parsed, version: row.version, createdAt: row.created_at, updatedAt: row.updated_at };
}

export function createPostgresJobRepository(
  db: Kysely<DatabaseTables>
): JobRepository {
  return {
    create(job, options = {}) {
      return Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", job.id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        if (existing) {
          return yield* Effect.fail(new DatabaseJobAlreadyExistsError({ jobId: job.id }));
        }

        const now = new Date().toISOString();
        const record: JobRecord = {
          ...job,
          status: options.progress ? "running" : "queued",
          progress: options.progress ?? { currentStep: "", stepIndex: 0, totalSteps: 1, percent: 0 },
          progressHistory: options.progressHistory ?? [],
          result: options.result ?? null,
          error: options.error ?? null,
          version: 1,
          history: options.history ?? [{ type: "created", at: now, payload: { job } }],
          createdAt: now,
          updatedAt: now,
          completedAt: null
        };

        yield* Effect.tryPromise({
          try: () => db.insertInto("jobs").values(serializeJob(record)).execute(),
          catch: (e) => new DatabaseJobAlreadyExistsError({ jobId: job.id })
        });

        return record;
      });
    },

    save(record) {
      return Effect.gen(function* () {
        const current = yield* Effect.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", record.id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        if (!current) {
          return yield* Effect.fail(new DatabaseJobNotFoundError({ jobId: record.id }));
        }

        const next = { ...record, version: current.version + 1 };

        yield* Effect.tryPromise({
          try: () => db.updateTable("jobs").set(serializeJob(next)).where("id", "=", record.id).execute(),
          catch: (e) => new DatabaseJobNotFoundError({ jobId: record.id })
        });

        return next;
      });
    },

    findById(id) {
      return Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return row ? parseJob(row) : undefined;
      });
    },

    list() {
      return Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () => db.selectFrom("jobs").selectAll().execute(),
          catch: () => [] as { id: string; data: string; version: number; created_at: string; updated_at: string }[]
        }).pipe(Effect.catchAll(() => Effect.succeed([] as { id: string; data: string; version: number; created_at: string; updated_at: string }[])));

        return rows.map(parseJob);
      });
    },

    listByUser(userId, limit, offset) {
      return Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () =>
            db
              .selectFrom("jobs")
              .selectAll()
              .where("user_id", "=", userId)
              .orderBy("created_at", "desc")
              .limit(limit)
              .offset(offset)
              .execute(),
          catch: () => [] as { id: string; data: unknown; version: number; created_at: string; updated_at: string }[]
        }).pipe(
          Effect.catchAll(() =>
            Effect.succeed([] as { id: string; data: unknown; version: number; created_at: string; updated_at: string }[])
          )
        );

        return rows.map(parseJob);
      });
    },

    countByUser(userId) {
      return Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () =>
            db
              .selectFrom("jobs")
              .select((eb) => eb.fn.countAll<number>().as("count"))
              .where("user_id", "=", userId)
              .executeTakeFirst(),
          catch: () => ({ count: 0 })
        }).pipe(Effect.catchAll(() => Effect.succeed({ count: 0 })));

        return Number(row?.count ?? 0);
      });
    },

    remove(id) {
      return Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () => db.deleteFrom("jobs").where("id", "=", id).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect.catchAll(() => Effect.succeed({ numDeletedRows: 0n })));

        return result.numDeletedRows > 0n;
      });
    },

    appendHistory(id, entry) {
      return Effect.gen(function* () {
        const current = yield* Effect.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        if (!current) {
          return yield* Effect.fail(new DatabaseJobNotFoundError({ jobId: id }));
        }

        const record = parseJob(current);
        const next = { ...record, history: [...record.history, entry], updatedAt: entry.at };

        yield* Effect.tryPromise({
          try: () => db.updateTable("jobs").set(serializeJob(next)).where("id", "=", id).execute(),
          catch: (e) => new DatabaseJobNotFoundError({ jobId: id })
        });

        return next;
      });
    },

    recordProgress(id, progress, at = new Date().toISOString()) {
      return Effect.gen(function* () {
        const current = yield* Effect.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        if (!current) {
          return yield* Effect.fail(new DatabaseJobNotFoundError({ jobId: id }));
        }

        const record = parseJob(current);
        const next = {
          ...record,
          status: "running" as const,
          progress,
          progressHistory: [...record.progressHistory, { at, progress }],
          updatedAt: at
        };

        yield* Effect.tryPromise({
          try: () => db.updateTable("jobs").set(serializeJob(next)).where("id", "=", id).execute(),
          catch: (e) => new DatabaseJobNotFoundError({ jobId: id })
        });

        return next;
      });
    },

    complete(id, result, at = new Date().toISOString()) {
      return Effect.gen(function* () {
        const current = yield* Effect.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        if (!current) {
          return yield* Effect.fail(new DatabaseJobNotFoundError({ jobId: id }));
        }

        const record = parseJob(current);
        const next = {
          ...record,
          status: "done" as const,
          result,
          error: null,
          progress: { ...record.progress, percent: 100 },
          progressHistory: [...record.progressHistory, { at, progress: { ...record.progress, percent: 100 } }],
          updatedAt: at,
          completedAt: at
        };

        yield* Effect.tryPromise({
          try: () => db.updateTable("jobs").set(serializeJob(next)).where("id", "=", id).execute(),
          catch: (e) => new DatabaseJobNotFoundError({ jobId: id })
        });

        return next;
      });
    },

    fail(id, error, at = new Date().toISOString()) {
      return Effect.gen(function* () {
        const current = yield* Effect.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        if (!current) {
          return yield* Effect.fail(new DatabaseJobNotFoundError({ jobId: id }));
        }

        const record = parseJob(current);
        const next = {
          ...record,
          status: "failed" as const,
          result: null,
          error,
          updatedAt: at,
          completedAt: at
        };

        yield* Effect.tryPromise({
          try: () => db.updateTable("jobs").set(serializeJob(next)).where("id", "=", id).execute(),
          catch: (e) => new DatabaseJobNotFoundError({ jobId: id })
        });

        return next;
      });
    }
  };
}
