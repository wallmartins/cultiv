import { Effect } from "effect";
import { Kysely } from "kysely";
import type { VoiceProfileSnapshotRecord, VoiceProfileSnapshotRepository } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";
import { postgresTryPromise } from "./postgres-try-promise.js";

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

        yield* postgresTryPromise("voice_profile_snapshots.create", () =>
          db.insertInto("voice_profile_snapshots").values(toRow(next)).execute()
        );

        return next;
      });
    },

    get(id) {
      return Effect.gen(function* () {
        const row = yield* postgresTryPromise("voice_profile_snapshots.get", () =>
          db.selectFrom("voice_profile_snapshots").where("id", "=", id).selectAll().executeTakeFirst()
        );

        return row ? parseRow(row) : undefined;
      });
    },

    listByUser(userId) {
      return Effect.gen(function* () {
        const rows = yield* postgresTryPromise("voice_profile_snapshots.listByUser", () =>
          db.selectFrom("voice_profile_snapshots").where("user_id", "=", userId).selectAll().execute()
        );

        return rows.map(parseRow);
      });
    },
    removeByUser(userId) {
      return Effect.gen(function* () {
        const result = yield* postgresTryPromise("voice_profile_snapshots.removeByUser", () =>
          db.deleteFrom("voice_profile_snapshots").where("user_id", "=", userId).executeTakeFirst()
        );

        return Number(result.numDeletedRows);
      });
    }
  };
}
