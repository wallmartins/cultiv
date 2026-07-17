import { Effect } from "effect";
import { Kysely } from "kysely";
import type { ExecutionReactionRecord, ExecutionReactionRepository } from "@my-ai-orchestrator/database";
import type { ExecutionReactionValue } from "@my-ai-orchestrator/contracts";
import type { DatabaseTables } from "../postgres-tables.js";
import { postgresTryPromise } from "./postgres-try-promise.js";

function toRow(record: ExecutionReactionRecord) {
  return {
    execution_id: record.executionId,
    user_id: record.userId,
    reaction: record.reaction,
    reason: record.reason ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}

function parseRow(row: {
  execution_id: string;
  user_id: string;
  reaction: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
}): ExecutionReactionRecord {
  return {
    executionId: row.execution_id,
    userId: row.user_id,
    reaction: row.reaction as ExecutionReactionValue,
    ...(row.reason ? { reason: row.reason } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createPostgresExecutionReactionRepository(
  db: Kysely<DatabaseTables>
): ExecutionReactionRepository {
  return {
    getByExecution(executionId) {
      return Effect.gen(function* () {
        const row = yield* postgresTryPromise("execution_reactions.getByExecution", () =>
          db.selectFrom("execution_reactions").where("execution_id", "=", executionId).selectAll().executeTakeFirst()
        );

        return row ? parseRow(row) : undefined;
      });
    },

    upsert(record) {
      return Effect.gen(function* () {
        const row = toRow(record);

        yield* postgresTryPromise("execution_reactions.upsert", () =>
          db
            .insertInto("execution_reactions")
            .values(row)
            .onConflict((oc) =>
              oc.column("execution_id").doUpdateSet({
                reaction: row.reaction,
                reason: row.reason,
                updated_at: row.updated_at
              })
            )
            .execute()
        );

        return record;
      });
    },

    deleteByExecution(executionId) {
      return Effect.gen(function* () {
        const result = yield* postgresTryPromise("execution_reactions.deleteByExecution", () =>
          db.deleteFrom("execution_reactions").where("execution_id", "=", executionId).executeTakeFirst()
        );

        return result.numDeletedRows > 0n;
      });
    },

    removeByUser(userId) {
      return Effect.gen(function* () {
        const result = yield* postgresTryPromise("execution_reactions.removeByUser", () =>
          db.deleteFrom("execution_reactions").where("user_id", "=", userId).executeTakeFirst()
        );

        return Number(result.numDeletedRows);
      });
    }
  };
}
