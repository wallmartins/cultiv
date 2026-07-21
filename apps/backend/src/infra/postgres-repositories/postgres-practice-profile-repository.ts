import { Effect } from "effect";
import { Kysely } from "kysely";
import type { PracticeProfileRecord, PracticeProfileRepository } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";
import { postgresTryPromise } from "./postgres-try-promise.js";

function toRow(record: PracticeProfileRecord) {
  return {
    id: record.id,
    user_id: record.userId,
    data: JSON.stringify(record),
    version: record.version
  };
}

function parseRow(row: { id: string; user_id: string; data: unknown; version: number }): PracticeProfileRecord {
  return {
    ...parseStoredJsonRecord<PracticeProfileRecord>(row.data),
    version: row.version
  };
}

export function createPostgresPracticeProfileRepository(
  db: Kysely<DatabaseTables>
): PracticeProfileRepository {
  return {
    put(record, version = 1) {
      return Effect.gen(function* () {
        const next: PracticeProfileRecord = {
          ...record,
          profileVersion: record.version,
          version
        };

        yield* postgresTryPromise("practice_profiles.put", () =>
          db.insertInto("practice_profiles")
            .values(toRow(next))
            .onConflict((oc) => oc.column("user_id").doUpdateSet(toRow(next)))
            .execute()
        );

        return next;
      });
    },

    getByUser(userId) {
      return Effect.gen(function* () {
        const row = yield* postgresTryPromise("practice_profiles.getByUser", () =>
          db.selectFrom("practice_profiles")
            .where("user_id", "=", userId)
            .selectAll()
            .executeTakeFirst()
        );

        return row ? parseRow(row) : undefined;
      });
    },
    removeByUser(userId) {
      return Effect.gen(function* () {
        const result = yield* postgresTryPromise("practice_profiles.removeByUser", () =>
          db.deleteFrom("practice_profiles").where("user_id", "=", userId).executeTakeFirst()
        );

        return result.numDeletedRows > 0n;
      });
    }
  };
}
