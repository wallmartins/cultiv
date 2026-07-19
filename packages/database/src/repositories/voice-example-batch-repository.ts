import { Effect } from "effect";
import type { VoiceExampleBatchRecord, VoiceExampleBatchRepository } from "../types.js";
import type { StateRef } from "./shared.js";

export function createVoiceExampleBatchRepository(stateRef: StateRef): VoiceExampleBatchRepository {
  return {
    removeByUser(userId) {
      const entries = Object.entries(stateRef.current.voiceExampleBatches);
      const remaining: Record<string, VoiceExampleBatchRecord> = {};
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
        voiceExampleBatches: remaining
      };
      return Effect.succeed(removedCount);
    }
  };
}
