import { Effect } from "effect";
import {
  DatabaseVoiceBatchAlreadyExistsError,
  DatabaseVoiceBatchNotFoundError
} from "../errors.js";
import { toVoiceExampleBatchRecord } from "../converters.js";
import type { VoiceExampleBatchRepository } from "../types.js";
import { cloneRecord, type StateRef } from "./shared.js";

export function createVoiceExampleBatchRepository(stateRef: StateRef): VoiceExampleBatchRepository {
  return {
    create(record, version = 1) {
      if (stateRef.current.voiceExampleBatches[record.id]) {
        return Effect.fail(new DatabaseVoiceBatchAlreadyExistsError({ batchId: record.id }));
      }
      const next = toVoiceExampleBatchRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        voiceExampleBatches: {
          ...stateRef.current.voiceExampleBatches,
          [next.id]: next
        }
      };
      return Effect.succeed(cloneRecord(next));
    },
    save(record) {
      if (!stateRef.current.voiceExampleBatches[record.id]) {
        return Effect.fail(new DatabaseVoiceBatchNotFoundError({ batchId: record.id }));
      }
      const next = {
        ...record,
        version: record.version + 1
      };
      stateRef.current = {
        ...stateRef.current,
        voiceExampleBatches: {
          ...stateRef.current.voiceExampleBatches,
          [next.id]: next
        }
      };
      return Effect.succeed(cloneRecord(next));
    },
    get(id) {
      const record = stateRef.current.voiceExampleBatches[id];
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    },
    listByUser(userId) {
      return Effect.succeed(
        Object.values(stateRef.current.voiceExampleBatches)
          .filter((record) => record.userId === userId)
          .map(cloneRecord)
      );
    },
    remove(id) {
      if (!stateRef.current.voiceExampleBatches[id]) {
        return Effect.succeed(false);
      }
      const { [id]: _removed, ...voiceExampleBatches } = stateRef.current.voiceExampleBatches;
      stateRef.current = {
        ...stateRef.current,
        voiceExampleBatches
      };
      return Effect.succeed(true);
    }
  };
}
