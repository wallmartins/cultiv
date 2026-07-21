import { Effect } from "effect";
import { toPracticeProfileDiagnosticsRecord } from "../converters.js";
import type { PracticeProfileDiagnosticsRepository } from "../types.js";
import { cloneRecord, type StateRef } from "./shared.js";

export function createPracticeProfileDiagnosticsRepository(
  stateRef: StateRef
): PracticeProfileDiagnosticsRepository {
  return {
    put(record, version = 1) {
      const next = toPracticeProfileDiagnosticsRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        practiceProfileDiagnostics: {
          ...stateRef.current.practiceProfileDiagnostics,
          [record.userId]: next
        }
      };
      return Effect.succeed(cloneRecord(next));
    },
    getByUser(userId) {
      const record = stateRef.current.practiceProfileDiagnostics[userId];
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    },
    removeByUser(userId) {
      if (!stateRef.current.practiceProfileDiagnostics[userId]) {
        return Effect.succeed(false);
      }
      const { [userId]: _removed, ...practiceProfileDiagnostics } = stateRef.current.practiceProfileDiagnostics;
      stateRef.current = {
        ...stateRef.current,
        practiceProfileDiagnostics
      };
      return Effect.succeed(true);
    }
  };
}
