import { Effect } from "effect";
import { toVoiceProfileSnapshotRecord } from "../converters.js";
import type { VoiceProfileSnapshotRecord, VoiceProfileSnapshotRepository } from "../types.js";
import { cloneRecord, type StateRef } from "./shared.js";

export function createVoiceProfileSnapshotRepository(stateRef: StateRef): VoiceProfileSnapshotRepository {
  return {
    create(record, version = 1) {
      const next = toVoiceProfileSnapshotRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        voiceProfileSnapshots: {
          ...stateRef.current.voiceProfileSnapshots,
          [next.id]: next
        }
      };
      return Effect.succeed(cloneRecord(next));
    },
    get(id) {
      const record = stateRef.current.voiceProfileSnapshots[id];
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    },
    listByUser(userId) {
      return Effect.succeed(
        Object.values(stateRef.current.voiceProfileSnapshots)
          .filter((record) => record.userId === userId)
          .map(cloneRecord)
      );
    },
    removeByUser(userId) {
      const entries = Object.entries(stateRef.current.voiceProfileSnapshots);
      const remaining: Record<string, VoiceProfileSnapshotRecord> = {};
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
        voiceProfileSnapshots: remaining
      };
      return Effect.succeed(removedCount);
    }
  };
}
