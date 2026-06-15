import { Effect } from "effect";
import { toContentTypeRecord } from "../converters.js";
import type { ContentTypeRepository } from "../types.js";
import { cloneRecord, type StateRef } from "./shared.js";

export function createContentTypeRepository(stateRef: StateRef): ContentTypeRepository {
  return {
    put(record, version = 1, updatedAt = new Date().toISOString()) {
      const next = toContentTypeRecord(record, version, updatedAt);
      stateRef.current = {
        ...stateRef.current,
        contentTypes: {
          ...stateRef.current.contentTypes,
          [next.id]: next
        }
      };
      return Effect.succeed(cloneRecord(next));
    },
    get(id) {
      const record = stateRef.current.contentTypes[id];
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    },
    list() {
      return Effect.succeed(Object.values(stateRef.current.contentTypes).map(cloneRecord));
    }
  };
}
