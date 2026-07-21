import { Effect } from "effect";
import { toPracticeProfileRecord } from "../converters.js";
import type { PracticeProfileRepository } from "../types.js";
import { cloneRecord, type StateRef } from "./shared.js";

export function createPracticeProfileRepository(stateRef: StateRef): PracticeProfileRepository {
  return {
    put(record, version = 1) {
      const next = toPracticeProfileRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        practiceProfiles: {
          ...stateRef.current.practiceProfiles,
          [record.userId]: next
        }
      };
      return Effect.succeed(cloneRecord(next));
    },
    getByUser(userId) {
      const record = stateRef.current.practiceProfiles[userId];
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    },
    removeByUser(userId) {
      if (!stateRef.current.practiceProfiles[userId]) {
        return Effect.succeed(false);
      }
      const { [userId]: _removed, ...practiceProfiles } = stateRef.current.practiceProfiles;
      stateRef.current = {
        ...stateRef.current,
        practiceProfiles
      };
      return Effect.succeed(true);
    }
  };
}
