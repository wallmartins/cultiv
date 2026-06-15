import { Effect } from "effect";
import {
  DatabaseVoiceExampleAlreadyExistsError,
  DatabaseVoiceExampleNotFoundError
} from "../errors.js";
import { toVoiceExampleRecord } from "../converters.js";
import type { VoiceExampleRecord, VoiceExampleRepository } from "../types.js";
import { cloneRecord, type StateRef } from "./shared.js";

export function createVoiceExampleRepository(stateRef: StateRef): VoiceExampleRepository {
  return {
    create(record, version = 1) {
      if (stateRef.current.voiceExamples[record.id]) {
        return Effect.fail(new DatabaseVoiceExampleAlreadyExistsError({ exampleId: record.id }));
      }
      const next = toVoiceExampleRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        voiceExamples: {
          ...stateRef.current.voiceExamples,
          [next.id]: next
        }
      };
      return Effect.succeed(cloneRecord(next));
    },
    save(record) {
      if (!stateRef.current.voiceExamples[record.id]) {
        return Effect.fail(new DatabaseVoiceExampleNotFoundError({ exampleId: record.id }));
      }
      const next = {
        ...record,
        version: record.version + 1
      };
      stateRef.current = {
        ...stateRef.current,
        voiceExamples: {
          ...stateRef.current.voiceExamples,
          [next.id]: next
        }
      };
      return Effect.succeed(cloneRecord(next));
    },
    get(id) {
      const record = stateRef.current.voiceExamples[id];
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    },
    listByUser(userId) {
      return Effect.succeed(
        Object.values(stateRef.current.voiceExamples)
          .filter((record) => record.userId === userId)
          .map(cloneRecord)
      );
    },
    remove(id) {
      if (!stateRef.current.voiceExamples[id]) {
        return Effect.succeed(false);
      }
      const { [id]: _removed, ...voiceExamples } = stateRef.current.voiceExamples;
      stateRef.current = {
        ...stateRef.current,
        voiceExamples
      };
      return Effect.succeed(true);
    },
    removeByUser(userId) {
      const entries = Object.entries(stateRef.current.voiceExamples);
      const remaining: Record<string, VoiceExampleRecord> = {};
      let removedCount = 0;
      for (const [id, record] of entries) {
        if (record.userId === userId) {
          removedCount++;
        } else {
          remaining[id] = record;
        }
      }
      stateRef.current = {
        ...stateRef.current,
        voiceExamples: remaining
      };
      return Effect.succeed(removedCount);
    }
  };
}
