import { Effect } from "effect";
import { Kysely } from "kysely";
import type { VoiceExampleRecord, VoiceExampleRepository } from "@my-ai-orchestrator/database";
import {
  DatabaseVoiceExampleAlreadyExistsError,
  DatabaseVoiceExampleNotFoundError
} from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";

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
        const existing = yield* Effect.tryPromise({
          try: () => db.selectFrom("voice_examples").where("id", "=", record.id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        if (existing) {
          return yield* Effect.fail(new DatabaseVoiceExampleAlreadyExistsError({ exampleId: record.id }));
        }

        const next = { ...record, version };

        yield* Effect.tryPromise({
          try: () => db.insertInto("voice_examples").values(toRow(next)).execute(),
          catch: (e) => new DatabaseVoiceExampleAlreadyExistsError({ exampleId: record.id })
        });

        return next;
      });
    },

    save(record) {
      return Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () => db.selectFrom("voice_examples").where("id", "=", record.id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        if (!existing) {
          return yield* Effect.fail(new DatabaseVoiceExampleNotFoundError({ exampleId: record.id }));
        }

        const next = { ...record, version: record.version + 1 };

        yield* Effect.tryPromise({
          try: () => db.updateTable("voice_examples").set(toRow(next)).where("id", "=", record.id).execute(),
          catch: (e) => new DatabaseVoiceExampleNotFoundError({ exampleId: record.id })
        });

        return next;
      });
    },

    get(id) {
      return Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () => db.selectFrom("voice_examples").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return row ? parseRow(row) : undefined;
      });
    },

    listByUser(userId) {
      return Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () => db.selectFrom("voice_examples").where("user_id", "=", userId).selectAll().execute(),
          catch: () => [] as { id: string; user_id: string; data: string; version: number; created_at: string }[]
        }).pipe(Effect.catchAll(() => Effect.succeed([] as { id: string; user_id: string; data: string; version: number; created_at: string }[])));

        return rows.map(parseRow);
      });
    },

    remove(id) {
      return Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () => db.deleteFrom("voice_examples").where("id", "=", id).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect.catchAll(() => Effect.succeed({ numDeletedRows: 0n })));

        return result.numDeletedRows > 0n;
      });
    },
    removeByUser(userId) {
      return Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () => db.deleteFrom("voice_examples").where("user_id", "=", userId).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect.catchAll(() => Effect.succeed({ numDeletedRows: 0n })));

        return Number(result.numDeletedRows);
      });
    }
  };
}
