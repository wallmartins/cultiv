import { Effect } from "effect";
import { toVoiceProfileDiagnosticsRecord } from "../converters.js";
import type { VoiceProfileDiagnosticsRepository } from "../types.js";
import { cloneRecord, type StateRef } from "./shared.js";

export function createVoiceProfileDiagnosticsRepository(stateRef: StateRef): VoiceProfileDiagnosticsRepository {
  return {
    put(record, version = 1) {
      const next = toVoiceProfileDiagnosticsRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        voiceProfileDiagnostics: {
          ...stateRef.current.voiceProfileDiagnostics,
          [record.userId]: next
        }
      };
      return Effect.succeed(cloneRecord(next));
    },
    getByUser(userId) {
      const record = stateRef.current.voiceProfileDiagnostics[userId];
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    },
    removeByUser(userId) {
      if (!stateRef.current.voiceProfileDiagnostics[userId]) {
        return Effect.succeed(false);
      }
      const { [userId]: _removed, ...voiceProfileDiagnostics } = stateRef.current.voiceProfileDiagnostics;
      stateRef.current = {
        ...stateRef.current,
        voiceProfileDiagnostics
      };
      return Effect.succeed(true);
    }
  };
}
