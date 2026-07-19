import { Effect } from "effect";
import { toMemoryEntryRecord } from "../converters.js";
import type { MemoryEntryRecord, MemoryRepository } from "../types.js";
import { cloneRecord, memoryKey, type StateRef } from "./shared.js";

export function createMemoryRepository(stateRef: StateRef): MemoryRepository {
  return {
    put(record, version = 1) {
      const next = toMemoryEntryRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        memories: {
          ...stateRef.current.memories,
          [memoryKey(record.userId, record.key)]: next
        }
      };
      return Effect.succeed(cloneRecord(next));
    },
    get(userId, key) {
      const record = stateRef.current.memories[memoryKey(userId, key)];
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    },
    listByUser(userId) {
      return Effect.succeed(
        Object.values(stateRef.current.memories)
          .filter((record) => record.userId === userId)
          .map(cloneRecord)
      );
    },
    remove(userId, key) {
      const composite = memoryKey(userId, key);
      if (!stateRef.current.memories[composite]) {
        return Effect.succeed(false);
      }
      const { [composite]: _removed, ...memories } = stateRef.current.memories;
      stateRef.current = {
        ...stateRef.current,
        memories
      };
      return Effect.succeed(true);
    },
    removeByUser(userId) {
      const entries = Object.entries(stateRef.current.memories);
      const remaining: Record<string, MemoryEntryRecord> = {};
      let removedCount = 0;
      for (const [composite, record] of entries) {
        if (record.userId === userId) {
          removedCount++;
        } else {
          remaining[composite] = record;
        }
      }
      stateRef.current = {
        ...stateRef.current,
        memories: remaining
      };
      return Effect.succeed(removedCount);
    }
  };
}
