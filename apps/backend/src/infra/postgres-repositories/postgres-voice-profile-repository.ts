import { Effect } from "effect";
import { Kysely } from "kysely";
import type { VoiceProfileRecord, VoiceProfileRepository } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";
import { postgresTryPromise } from "./postgres-try-promise.js";

function toRow(record: VoiceProfileRecord) {
  return {
    id: record.id,
    user_id: record.userId,
    data: JSON.stringify(record),
    version: record.version
  };
}

function parseRow(row: { id: string; user_id: string; data: unknown; version: number }): VoiceProfileRecord {
  return {
    ...parseStoredJsonRecord<VoiceProfileRecord>(row.data),
    version: row.version
  };
}

export function createPostgresVoiceProfileRepository(
  db: Kysely<DatabaseTables>
): VoiceProfileRepository {
  return {
    put(record, version = 1) {
      return Effect.gen(function* () {
        const next: VoiceProfileRecord = {
          ...record,
          profileVersion: record.version,
          version
        };

        yield* postgresTryPromise("voice_profiles.put", () =>
          db.insertInto("voice_profiles")
            .values(toRow(next))
            .onConflict((oc) => oc.column("user_id").doUpdateSet(toRow(next)))
            .execute()
        );

        return next;
      });
    },

    getByUser(userId) {
      return Effect.gen(function* () {
        const row = yield* postgresTryPromise("voice_profiles.getByUser", () =>
          db.selectFrom("voice_profiles")
            .where("user_id", "=", userId)
            .selectAll()
            .executeTakeFirst()
        );

        return row ? parseRow(row) : undefined;
      });
    },
    removeByUser(userId) {
      return Effect.gen(function* () {
        const result = yield* postgresTryPromise("voice_profiles.removeByUser", () =>
          db.deleteFrom("voice_profiles").where("user_id", "=", userId).executeTakeFirst()
        );

        return result.numDeletedRows > 0n;
      });
    }
  };
}
