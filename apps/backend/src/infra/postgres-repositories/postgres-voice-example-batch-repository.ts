import { Effect } from "effect";
import { Kysely } from "kysely";
import type { VoiceExampleBatchRecord, VoiceExampleBatchRepository } from "@my-ai-orchestrator/database";
import {
  DatabaseVoiceBatchAlreadyExistsError,
  DatabaseVoiceBatchNotFoundError
} from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";
import { postgresTryPromise } from "./postgres-try-promise.js";

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
        const existing = yield* postgresTryPromise("voice_example_batches.create.lookup", () =>
          db.selectFrom("voice_example_batches").where("id", "=", record.id).selectAll().executeTakeFirst()
        );

        if (existing) {
          return yield* Effect.fail(new DatabaseVoiceBatchAlreadyExistsError({ batchId: record.id }));
        }

        const next = { ...record, version };

        yield* postgresTryPromise("voice_example_batches.create.insert", () =>
          db.insertInto("voice_example_batches").values(toRow(next)).execute()
        );

        return next;
      });
    },

    save(record) {
      return Effect.gen(function* () {
        const existing = yield* postgresTryPromise("voice_example_batches.save.lookup", () =>
          db.selectFrom("voice_example_batches").where("id", "=", record.id).selectAll().executeTakeFirst()
        );

        if (!existing) {
          return yield* Effect.fail(new DatabaseVoiceBatchNotFoundError({ batchId: record.id }));
        }

        const next = { ...record, version: record.version + 1, updatedAt: new Date().toISOString() };

        yield* postgresTryPromise("voice_example_batches.save.update", () =>
          db.updateTable("voice_example_batches").set(toRow(next)).where("id", "=", record.id).execute()
        );

        return next;
      });
    },

    get(id) {
      return Effect.gen(function* () {
        const row = yield* postgresTryPromise("voice_example_batches.get", () =>
          db.selectFrom("voice_example_batches").where("id", "=", id).selectAll().executeTakeFirst()
        );

        return row ? parseRow(row) : undefined;
      });
    },

    listByUser(userId) {
      return Effect.gen(function* () {
        const rows = yield* postgresTryPromise("voice_example_batches.listByUser", () =>
          db.selectFrom("voice_example_batches").where("user_id", "=", userId).selectAll().execute()
        );

        return rows.map(parseRow);
      });
    },

    remove(id) {
      return Effect.gen(function* () {
        const result = yield* postgresTryPromise("voice_example_batches.remove", () =>
          db.deleteFrom("voice_example_batches").where("id", "=", id).executeTakeFirst()
        );

        return result.numDeletedRows > 0n;
      });
    }
  };
}
