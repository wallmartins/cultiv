import { Effect } from "effect";
import { toVoiceTrainingConsentRecord } from "../converters.js";
import type { VoiceTrainingConsentRepository } from "../types.js";
import { cloneRecord, type StateRef } from "./shared.js";

export function createVoiceTrainingConsentRepository(stateRef: StateRef): VoiceTrainingConsentRepository {
  return {
    put(record, version = 1) {
      const next = toVoiceTrainingConsentRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        voiceTrainingConsents: {
          ...stateRef.current.voiceTrainingConsents,
          [record.userId]: next
        }
      };
      return Effect.succeed(cloneRecord(next));
    },
    getByUser(userId) {
      const record = stateRef.current.voiceTrainingConsents[userId];
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    }
  };
}
