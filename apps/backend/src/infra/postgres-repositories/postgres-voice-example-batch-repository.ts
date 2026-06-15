import { Effect } from "effect";
import { Kysely } from "kysely";
import type { VoiceExampleBatchRecord, VoiceExampleBatchRepository } from "@my-ai-orchestrator/database";
import {
  DatabaseVoiceBatchAlreadyExistsError,
  DatabaseVoiceBatchNotFoundError
} from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";

function toRow(record: VoiceExampleBatchRecord) {
  return {
    id: record.id,
    user_id: record.userId,
    data: JSON.stringify(record),
    version: record.version,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}

function parseRow(row: {
  id: string;
  user_id: string;
  data: unknown;
  version: number;
  created_at: string;
  updated_at: string;
}): VoiceExampleBatchRecord {
  return {
    ...parseStoredJsonRecord<VoiceExampleBatchRecord>(row.data),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createPostgresVoiceExampleBatchRepository(
  db: Kysely<DatabaseTables>
): VoiceExampleBatchRepository {
  return {
    create(record, version = 1) {
      return Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () => db.selectFrom("voice_example_batches").where("id", "=", record.id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        if (existing) {
          return yield* Effect.fail(new DatabaseVoiceBatchAlreadyExistsError({ batchId: record.id }));
        }

        const next = { ...record, version };

        yield* Effect.tryPromise({
          try: () => db.insertInto("voice_example_batches").values(toRow(next)).execute(),
          catch: (e) => new DatabaseVoiceBatchAlreadyExistsError({ batchId: record.id })
        });

        return next;
      });
    },

    save(record) {
      return Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () => db.selectFrom("voice_example_batches").where("id", "=", record.id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        if (!existing) {
          return yield* Effect.fail(new DatabaseVoiceBatchNotFoundError({ batchId: record.id }));
        }

        const next = { ...record, version: record.version + 1, updatedAt: new Date().toISOString() };

        yield* Effect.tryPromise({
          try: () => db.updateTable("voice_example_batches").set(toRow(next)).where("id", "=", record.id).execute(),
          catch: (e) => new DatabaseVoiceBatchNotFoundError({ batchId: record.id })
        });

        return next;
      });
    },

    get(id) {
      return Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () => db.selectFrom("voice_example_batches").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return row ? parseRow(row) : undefined;
      });
    },

    listByUser(userId) {
      return Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () => db.selectFrom("voice_example_batches").where("user_id", "=", userId).selectAll().execute(),
          catch: () => [] as { id: string; user_id: string; data: string; version: number; created_at: string; updated_at: string }[]
        }).pipe(Effect.catchAll(() => Effect.succeed([] as { id: string; user_id: string; data: string; version: number; created_at: string; updated_at: string }[])));

        return rows.map(parseRow);
      });
    },

    remove(id) {
      return Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () => db.deleteFrom("voice_example_batches").where("id", "=", id).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect.catchAll(() => Effect.succeed({ numDeletedRows: 0n })));

        return result.numDeletedRows > 0n;
      });
    }
  };
}
