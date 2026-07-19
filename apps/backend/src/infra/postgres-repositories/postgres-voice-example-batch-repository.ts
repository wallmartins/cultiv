import { Effect } from "effect";
import { Kysely } from "kysely";
import type { VoiceExampleBatchRepository } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { postgresTryPromise } from "./postgres-try-promise.js";

// contract-08 — voice_example_batches has no writer yet (migration 0001); this closes the
// removeByUser gap for account reset/delete so the table can never leak orphaned rows.
export function createPostgresVoiceExampleBatchRepository(
  db: Kysely<DatabaseTables>
): VoiceExampleBatchRepository {
  return {
    removeByUser(userId) {
      return Effect.gen(function* () {
        const result = yield* postgresTryPromise("voiceExampleBatches.removeByUser", () =>
          db.deleteFrom("voice_example_batches").where("user_id", "=", userId).executeTakeFirst()
        );

        return Number(result.numDeletedRows);
      });
    }
  };
}
