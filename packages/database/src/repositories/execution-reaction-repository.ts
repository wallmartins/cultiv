import { Effect } from "effect";
import type { ExecutionReactionRecord, ExecutionReactionRepository } from "../types.js";
import { cloneRecord, type StateRef } from "./shared.js";

export function createExecutionReactionRepository(stateRef: StateRef): ExecutionReactionRepository {
  return {
    getByExecution(executionId) {
      const record = stateRef.current.executionReactions[executionId];
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    },
    upsert(record) {
      stateRef.current = {
        ...stateRef.current,
        executionReactions: {
          ...stateRef.current.executionReactions,
          [record.executionId]: record
        }
      };
      return Effect.succeed(cloneRecord(record));
    },
    deleteByExecution(executionId) {
      if (!stateRef.current.executionReactions[executionId]) {
        return Effect.succeed(false);
      }
      const { [executionId]: _removed, ...executionReactions } = stateRef.current.executionReactions;
      stateRef.current = {
        ...stateRef.current,
        executionReactions
      };
      return Effect.succeed(true);
    },
    removeByUser(userId) {
      const remaining: ExecutionReactionRecord[] = [];
      let removed = 0;
      for (const record of Object.values(stateRef.current.executionReactions)) {
        if (record.userId === userId) {
          removed += 1;
        } else {
          remaining.push(record);
        }
      }

      if (removed === 0) {
        return Effect.succeed(0);
      }

      stateRef.current = {
        ...stateRef.current,
        executionReactions: Object.fromEntries(remaining.map((record) => [record.executionId, record]))
      };
      return Effect.succeed(removed);
    }
  };
}
