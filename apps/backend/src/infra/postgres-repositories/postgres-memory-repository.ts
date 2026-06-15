import { Effect } from "effect";
import { Kysely } from "kysely";
import type { MemoryEntryRecord, MemoryRepository } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";

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

        yield* Effect.tryPromise({
          try: () =>
            db.insertInto("memories")
              .values(toRow(next))
              .onConflict((oc) => oc.column("id").doUpdateSet(toRow(next)))
              .execute(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return next;
      });
    },

    get(userId, key) {
      return Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () =>
            db.selectFrom("memories")
              .where("user_id", "=", userId)
              .where("key", "=", key)
              .selectAll()
              .executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return row ? parseRow(row) : undefined;
      });
    },

    listByUser(userId) {
      return Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () =>
            db.selectFrom("memories")
              .where("user_id", "=", userId)
              .selectAll()
              .execute(),
          catch: () => [] as { id: string; user_id: string; key: string; data: string; version: number; created_at: string; updated_at: string }[]
        }).pipe(Effect.catchAll(() => Effect.succeed([] as { id: string; user_id: string; key: string; data: string; version: number; created_at: string; updated_at: string }[])));

        return rows.map(parseRow);
      });
    },

    remove(userId, key) {
      return Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () =>
            db.deleteFrom("memories")
              .where("user_id", "=", userId)
              .where("key", "=", key)
              .executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect.catchAll(() => Effect.succeed({ numDeletedRows: 0n })));

        return result.numDeletedRows > 0n;
      });
    }
  };
}
