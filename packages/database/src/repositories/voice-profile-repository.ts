import { Effect } from "effect";
import { toVoiceProfileRecord } from "../converters.js";
import type { VoiceProfileRepository } from "../types.js";
import { cloneRecord, type StateRef } from "./shared.js";

export function createVoiceProfileRepository(stateRef: StateRef): VoiceProfileRepository {
  return {
    put(record, version = 1) {
      const next = toVoiceProfileRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        voiceProfiles: {
          ...stateRef.current.voiceProfiles,
          [record.userId]: next
        }
      };
      return Effect.succeed(cloneRecord(next));
    },
    getByUser(userId) {
      const record = stateRef.current.voiceProfiles[userId];
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    },
    removeByUser(userId) {
      if (!stateRef.current.voiceProfiles[userId]) {
        return Effect.succeed(false);
      }
      const { [userId]: _removed, ...voiceProfiles } = stateRef.current.voiceProfiles;
      stateRef.current = {
        ...stateRef.current,
        voiceProfiles
      };
      return Effect.succeed(true);
    }
  };
}
