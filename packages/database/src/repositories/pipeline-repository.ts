import { Effect } from "effect";
import { toPipelineRecord } from "../converters.js";
import type { PipelineRepository } from "../types.js";
import { cloneRecord, type StateRef } from "./shared.js";

export function createPipelineRepository(stateRef: StateRef): PipelineRepository {
  return {
    put(record, version = 1, updatedAt = new Date().toISOString()) {
      const next = toPipelineRecord(record, version, updatedAt);
      stateRef.current = {
        ...stateRef.current,
        pipelines: {
          ...stateRef.current.pipelines,
          [next.id]: next
        }
      };
      return Effect.succeed(cloneRecord(next));
    },
    get(id) {
      const record = stateRef.current.pipelines[id];
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    },
    list() {
      return Effect.succeed(Object.values(stateRef.current.pipelines).map(cloneRecord));
    }
  };
}
