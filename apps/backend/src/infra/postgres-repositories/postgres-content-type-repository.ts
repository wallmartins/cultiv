import { Effect } from "effect";
import { Kysely } from "kysely";
import type { ContentTypeRecord, ContentTypeRepository } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";

function toRow(record: ContentTypeRecord) {
  return {
    id: record.id,
    data: JSON.stringify(record),
    version: record.version,
    updated_at: record.updatedAt
  };
}

function parseRow(row: { id: string; data: unknown; version: number; updated_at: string }): ContentTypeRecord {
  return {
    ...parseStoredJsonRecord<ContentTypeRecord>(row.data),
    version: row.version,
    updatedAt: row.updated_at
  };
}

export function createPostgresContentTypeRepository(
  db: Kysely<DatabaseTables>
): ContentTypeRepository {
  return {
    put(record, version = 1, updatedAt = new Date().toISOString()) {
      return Effect.gen(function* () {
        const next = { ...record, version, updatedAt };

        yield* Effect.tryPromise({
          try: () =>
            db.insertInto("content_types")
              .values(toRow(next))
              .onConflict((oc) => oc.column("id").doUpdateSet(toRow(next)))
              .execute(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return next;
      });
    },

    get(id) {
      return Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () =>
            db.selectFrom("content_types")
              .where("id", "=", id)
              .selectAll()
              .executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return row ? parseRow(row) : undefined;
      });
    },

    list() {
      return Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () => db.selectFrom("content_types").selectAll().execute(),
          catch: () => [] as { id: string; data: string; version: number; updated_at: string }[]
        }).pipe(Effect.catchAll(() => Effect.succeed([] as { id: string; data: string; version: number; updated_at: string }[])));

        return rows.map(parseRow);
      });
    }
  };
}
