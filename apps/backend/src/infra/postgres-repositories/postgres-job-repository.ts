import { Effect } from "effect";
import { Kysely, sql } from "kysely";
import {
  DatabaseJobAlreadyExistsError,
  DatabaseJobNotFoundError,
  type JobCreateOptions,
  type JobRecord,
  type JobRepository
} from "@my-ai-orchestrator/database";
import {
  resolveExecutionsPeriodCutoff,
  type ExecutionsListFilters
} from "@my-ai-orchestrator/contracts";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";
import { postgresTryPromise } from "./postgres-try-promise.js";

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
        const existing = yield* postgresTryPromise("jobs.create.lookup", () =>
          db.selectFrom("jobs").where("id", "=", job.id).selectAll().executeTakeFirst()
        );

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

        yield* postgresTryPromise("jobs.create.insert", () =>
          db.insertInto("jobs").values(serializeJob(record)).execute()
        );

        return record;
      });
    },

    save(record) {
      return Effect.gen(function* () {
        const current = yield* postgresTryPromise("jobs.save.lookup", () =>
          db.selectFrom("jobs").where("id", "=", record.id).selectAll().executeTakeFirst()
        );

        if (!current) {
          return yield* Effect.fail(new DatabaseJobNotFoundError({ jobId: record.id }));
        }

        const next = { ...record, version: current.version + 1 };

        yield* postgresTryPromise("jobs.save.update", () =>
          db.updateTable("jobs").set(serializeJob(next)).where("id", "=", record.id).execute()
        );

        return next;
      });
    },

    findById(id) {
      return Effect.gen(function* () {
        const row = yield* postgresTryPromise("jobs.findById", () =>
          db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst()
        );

        return row ? parseJob(row) : undefined;
      });
    },

    list() {
      return Effect.gen(function* () {
        const rows = yield* postgresTryPromise("jobs.list", () =>
          db.selectFrom("jobs").selectAll().execute()
        );

        return rows.map(parseJob);
      });
    },

    listByUser(userId, limit, offset, filters) {
      return Effect.gen(function* () {
        let query = db
          .selectFrom("jobs")
          .selectAll()
          .where("user_id", "=", userId);

        query = applyJobListFilters(query, filters);

        const rows = yield* postgresTryPromise("jobs.listByUser", () =>
          query.orderBy("created_at", "desc").limit(limit).offset(offset).execute()
        );

        return rows.map(parseJob);
      });
    },

    countByUser(userId, filters) {
      return Effect.gen(function* () {
        let query = db
          .selectFrom("jobs")
          .select((eb) => eb.fn.countAll<number>().as("count"))
          .where("user_id", "=", userId);

        query = applyJobListFilters(query, filters);

        const row = yield* postgresTryPromise("jobs.countByUser", () => query.executeTakeFirst());

        return Number(row?.count ?? 0);
      });
    },

    remove(id) {
      return Effect.gen(function* () {
        const result = yield* postgresTryPromise("jobs.remove", () =>
          db.deleteFrom("jobs").where("id", "=", id).executeTakeFirst()
        );

        return result.numDeletedRows > 0n;
      });
    },

    appendHistory(id, entry) {
      return Effect.gen(function* () {
        const current = yield* postgresTryPromise("jobs.appendHistory.lookup", () =>
          db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst()
        );

        if (!current) {
          return yield* Effect.fail(new DatabaseJobNotFoundError({ jobId: id }));
        }

        const record = parseJob(current);
        const next = { ...record, history: [...record.history, entry], updatedAt: entry.at };

        yield* postgresTryPromise("jobs.appendHistory.update", () =>
          db.updateTable("jobs").set(serializeJob(next)).where("id", "=", id).execute()
        );

        return next;
      });
    },

    recordProgress(id, progress, at = new Date().toISOString()) {
      return Effect.gen(function* () {
        const current = yield* postgresTryPromise("jobs.recordProgress.lookup", () =>
          db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst()
        );

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

        yield* postgresTryPromise("jobs.recordProgress.update", () =>
          db.updateTable("jobs").set(serializeJob(next)).where("id", "=", id).execute()
        );

        return next;
      });
    },

    complete(id, result, at = new Date().toISOString()) {
      return Effect.gen(function* () {
        const current = yield* postgresTryPromise("jobs.complete.lookup", () =>
          db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst()
        );

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

        yield* postgresTryPromise("jobs.complete.update", () =>
          db.updateTable("jobs").set(serializeJob(next)).where("id", "=", id).execute()
        );

        return next;
      });
    },

    fail(id, error, at = new Date().toISOString()) {
      return Effect.gen(function* () {
        const current = yield* postgresTryPromise("jobs.fail.lookup", () =>
          db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst()
        );

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

        yield* postgresTryPromise("jobs.fail.update", () =>
          db.updateTable("jobs").set(serializeJob(next)).where("id", "=", id).execute()
        );

        return next;
      });
    }
  };
}

function applyJobListFilters<QB extends { where: (...args: never[]) => QB }>(
  query: QB,
  filters?: ExecutionsListFilters
): QB {
  if (!filters) {
    return query;
  }

  let next = query;
  const cutoff = resolveExecutionsPeriodCutoff(filters.period);
  if (cutoff) {
    next = next.where("created_at", ">=", cutoff);
  }

  if (filters.status !== "all") {
    next = next.where(sql`data->>'status'`, "=", filters.status);
  }

  if (filters.contentType) {
    next = next.where(sql`data->>'contentType'`, "=", filters.contentType);
  }

  return next;
}
