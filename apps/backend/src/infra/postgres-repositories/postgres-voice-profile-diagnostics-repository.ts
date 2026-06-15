import { Effect } from "effect";
import { Kysely } from "kysely";
import type { VoiceProfileDiagnosticsRecord, VoiceProfileDiagnosticsRepository } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";

function toRow(record: VoiceProfileDiagnosticsRecord) {
  return {
    id: record.id,
    user_id: record.userId,
    data: JSON.stringify(record),
    version: record.version
  };
}

function parseRow(row: {
  id: string;
  user_id: string;
  data: unknown;
  version: number;
}): VoiceProfileDiagnosticsRecord {
  return { ...parseStoredJsonRecord<VoiceProfileDiagnosticsRecord>(row.data), version: row.version };
}

export function createPostgresVoiceProfileDiagnosticsRepository(
  db: Kysely<DatabaseTables>
): VoiceProfileDiagnosticsRepository {
  return {
    put(record, version = 1) {
      return Effect.gen(function* () {
        const next = { ...record, version };

        yield* Effect.tryPromise({
          try: () =>
            db.insertInto("voice_profile_diagnostics")
              .values(toRow(next))
              .onConflict((oc) => oc.column("user_id").doUpdateSet(toRow(next)))
              .execute(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return next;
      });
    },

    getByUser(userId) {
      return Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () =>
            db.selectFrom("voice_profile_diagnostics")
              .where("user_id", "=", userId)
              .selectAll()
              .executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return row ? parseRow(row) : undefined;
      });
    },
    removeByUser(userId) {
      return Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () => db.deleteFrom("voice_profile_diagnostics").where("user_id", "=", userId).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect.catchAll(() => Effect.succeed({ numDeletedRows: 0n })));

        return result.numDeletedRows > 0n;
      });
    }
  };
}
