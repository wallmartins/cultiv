import { Effect } from "effect";
import { Kysely } from "kysely";
import type { VoiceExampleRecord, VoiceExampleRepository } from "@my-ai-orchestrator/database";
import {
  DatabaseVoiceExampleAlreadyExistsError,
  DatabaseVoiceExampleNotFoundError
} from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";
import { postgresTryPromise } from "./postgres-try-promise.js";

function toRow(record: VoiceExampleRecord) {
  return {
    id: record.id,
    user_id: record.userId,
    data: JSON.stringify(record),
    version: record.version,
    created_at: record.createdAt
  };
}

function parseRow(row: {
  id: string;
  user_id: string;
  data: unknown;
  version: number;
  created_at: string;
}): VoiceExampleRecord {
  return {
    ...parseStoredJsonRecord<VoiceExampleRecord>(row.data),
    version: row.version,
    createdAt: row.created_at
  };
}

export function createPostgresVoiceExampleRepository(
  db: Kysely<DatabaseTables>
): VoiceExampleRepository {
  return {
    create(record, version = 1) {
      return Effect.gen(function* () {
        const existing = yield* postgresTryPromise("voice_examples.create.lookup", () =>
          db.selectFrom("voice_examples").where("id", "=", record.id).selectAll().executeTakeFirst()
        );

        if (existing) {
          return yield* Effect.fail(new DatabaseVoiceExampleAlreadyExistsError({ exampleId: record.id }));
        }

        const next = { ...record, version };

        yield* postgresTryPromise("voice_examples.create.insert", () =>
          db.insertInto("voice_examples").values(toRow(next)).execute()
        );

        return next;
      });
    },

    save(record) {
      return Effect.gen(function* () {
        const existing = yield* postgresTryPromise("voice_examples.save.lookup", () =>
          db.selectFrom("voice_examples").where("id", "=", record.id).selectAll().executeTakeFirst()
        );

        if (!existing) {
          return yield* Effect.fail(new DatabaseVoiceExampleNotFoundError({ exampleId: record.id }));
        }

        const next = { ...record, version: record.version + 1 };

        yield* postgresTryPromise("voice_examples.save.update", () =>
          db.updateTable("voice_examples").set(toRow(next)).where("id", "=", record.id).execute()
        );

        return next;
      });
    },

    get(id) {
      return Effect.gen(function* () {
        const row = yield* postgresTryPromise("voice_examples.get", () =>
          db.selectFrom("voice_examples").where("id", "=", id).selectAll().executeTakeFirst()
        );

        return row ? parseRow(row) : undefined;
      });
    },

    listByUser(userId) {
      return Effect.gen(function* () {
        const rows = yield* postgresTryPromise("voice_examples.listByUser", () =>
          db.selectFrom("voice_examples").where("user_id", "=", userId).selectAll().execute()
        );

        return rows.map(parseRow);
      });
    },

    remove(id) {
      return Effect.gen(function* () {
        const result = yield* postgresTryPromise("voice_examples.remove", () =>
          db.deleteFrom("voice_examples").where("id", "=", id).executeTakeFirst()
        );

        return result.numDeletedRows > 0n;
      });
    },
    removeByUser(userId) {
      return Effect.gen(function* () {
        const result = yield* postgresTryPromise("voice_examples.removeByUser", () =>
          db.deleteFrom("voice_examples").where("user_id", "=", userId).executeTakeFirst()
        );

        return Number(result.numDeletedRows);
      });
    }
  };
}
