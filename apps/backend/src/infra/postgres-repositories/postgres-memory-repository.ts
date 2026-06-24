import { Effect } from "effect";
import { Kysely } from "kysely";
import type { MemoryEntryRecord, MemoryRepository } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";
import { postgresTryPromise } from "./postgres-try-promise.js";

function toRow(record: MemoryEntryRecord) {
  return {
    id: record.id,
    user_id: record.userId,
    key: record.key,
    data: JSON.stringify(record),
    version: record.version,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}

function parseRow(row: {
  id: string;
  user_id: string;
  key: string;
  data: unknown;
  version: number;
  created_at: string;
  updated_at: string;
}): MemoryEntryRecord {
  return {
    ...parseStoredJsonRecord<MemoryEntryRecord>(row.data),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createPostgresMemoryRepository(
  db: Kysely<DatabaseTables>
): MemoryRepository {
  return {
    put(record, version = 1) {
      return Effect.gen(function* () {
        const now = new Date().toISOString();
        const next: MemoryEntryRecord = {
          ...record,
          version,
          createdAt: record.createdAt ?? now,
          updatedAt: record.updatedAt ?? now
        };

        yield* postgresTryPromise("memories.put", () =>
          db.insertInto("memories")
            .values(toRow(next))
            .onConflict((oc) => oc.column("id").doUpdateSet(toRow(next)))
            .execute()
        );

        return next;
      });
    },

    get(userId, key) {
      return Effect.gen(function* () {
        const row = yield* postgresTryPromise("memories.get", () =>
          db.selectFrom("memories")
            .where("user_id", "=", userId)
            .where("key", "=", key)
            .selectAll()
            .executeTakeFirst()
        );

        return row ? parseRow(row) : undefined;
      });
    },

    listByUser(userId) {
      return Effect.gen(function* () {
        const rows = yield* postgresTryPromise("memories.listByUser", () =>
          db.selectFrom("memories")
            .where("user_id", "=", userId)
            .selectAll()
            .execute()
        );

        return rows.map(parseRow);
      });
    },

    remove(userId, key) {
      return Effect.gen(function* () {
        const result = yield* postgresTryPromise("memories.remove", () =>
          db.deleteFrom("memories")
            .where("user_id", "=", userId)
            .where("key", "=", key)
            .executeTakeFirst()
        );

        return result.numDeletedRows > 0n;
      });
    }
  };
}
