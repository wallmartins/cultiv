import { Effect } from "effect";
import { Kysely } from "kysely";
import type { VoiceProfileSnapshotRecord, VoiceProfileSnapshotRepository } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";

function toRow(record: VoiceProfileSnapshotRecord) {
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
}): VoiceProfileSnapshotRecord {
  return {
    ...parseStoredJsonRecord<VoiceProfileSnapshotRecord>(row.data),
    version: row.version,
    createdAt: row.created_at
  };
}

export function createPostgresVoiceProfileSnapshotRepository(
  db: Kysely<DatabaseTables>
): VoiceProfileSnapshotRepository {
  return {
    create(record, version = 1) {
      return Effect.gen(function* () {
        const next = { ...record, version };

        yield* Effect.tryPromise({
          try: () => db.insertInto("voice_profile_snapshots").values(toRow(next)).execute(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return next;
      });
    },

    get(id) {
      return Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () => db.selectFrom("voice_profile_snapshots").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return row ? parseRow(row) : undefined;
      });
    },

    listByUser(userId) {
      return Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () => db.selectFrom("voice_profile_snapshots").where("user_id", "=", userId).selectAll().execute(),
          catch: () => [] as { id: string; user_id: string; data: string; version: number; created_at: string }[]
        }).pipe(Effect.catchAll(() => Effect.succeed([] as { id: string; user_id: string; data: string; version: number; created_at: string }[])));

        return rows.map(parseRow);
      });
    },
    removeByUser(userId) {
      return Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () => db.deleteFrom("voice_profile_snapshots").where("user_id", "=", userId).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect.catchAll(() => Effect.succeed({ numDeletedRows: 0n })));

        return Number(result.numDeletedRows);
      });
    }
  };
}
