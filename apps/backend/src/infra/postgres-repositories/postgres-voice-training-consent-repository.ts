import { Effect } from "effect";
import { Kysely } from "kysely";
import type { VoiceTrainingConsent } from "@my-ai-orchestrator/domain";
import type { VoiceTrainingConsentRecord, VoiceTrainingConsentRepository } from "@my-ai-orchestrator/database";
import { toVoiceTrainingConsentRecord } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";
import { postgresTryPromise } from "./postgres-try-promise.js";

function toRow(record: VoiceTrainingConsentRecord) {
  return {
    id: record.id,
    user_id: record.userId,
    data: JSON.stringify(record),
    version: record.version,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}

function parseRow(row: {
  id: string;
  user_id: string;
  data: unknown;
  version: number;
  created_at: string;
  updated_at: string;
}): VoiceTrainingConsentRecord {
  return {
    ...parseStoredJsonRecord<VoiceTrainingConsentRecord>(row.data),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createPostgresVoiceTrainingConsentRepository(
  db: Kysely<DatabaseTables>
): VoiceTrainingConsentRepository {
  return {
    put(record: VoiceTrainingConsent, version = 1) {
      return Effect.gen(function* () {
        const next = toVoiceTrainingConsentRecord(record, version);

        yield* postgresTryPromise("voice_training_consents.put", () =>
          db.insertInto("voice_training_consents")
            .values(toRow(next))
            .onConflict((oc) => oc.column("user_id").doUpdateSet(toRow(next)))
            .execute()
        );

        return next;
      });
    },

    getByUser(userId) {
      return Effect.gen(function* () {
        const row = yield* postgresTryPromise("voice_training_consents.getByUser", () =>
          db.selectFrom("voice_training_consents")
            .where("user_id", "=", userId)
            .selectAll()
            .executeTakeFirst()
        );

        return row ? parseRow(row) : undefined;
      });
    }
  };
}
