import { Effect, Ref } from "effect";
import type { DatabaseClient, DatabaseError } from "@my-ai-orchestrator/database";
import type { MemoryManager, MemoryQuery } from "@my-ai-orchestrator/core";
import type { BackendMemoryEntry, BackendMemoryState } from "./memory.js";

export function createBackendMemoryManager(
  memoryState: Ref.Ref<BackendMemoryState>,
  options: {
    readonly database?: DatabaseClient;
    readonly namespace: string;
  }
): MemoryManager<DatabaseError> {
  return {
    read: (key) =>
      Ref.get(memoryState).pipe(Effect.map((state) => state.entries.get(key)?.value)),
    write: (key, value) =>
      Effect.gen(function* () {
        const updatedAt = new Date().toISOString();
        yield* Ref.update(memoryState, (state) => {
          const entries = new Map(state.entries);
          entries.set(key, {
            key,
            value,
            updatedAt
          });
          return {
            ...state,
            entries
          };
        });
        if (options.database) {
          yield* options.database.memories.put(
            {
              id: `${options.namespace}:${key}`,
              userId: options.namespace,
              key,
              value,
              createdAt: updatedAt,
              updatedAt
            },
            1
          );
        }
      }),
    list: () =>
      Ref.get(memoryState).pipe(Effect.map((state) => Array.from(state.entries.keys()))),
    delete: (key) =>
      Effect.gen(function* () {
        yield* Ref.update(memoryState, (state) => {
          const entries = new Map(state.entries);
          entries.delete(key);
          return {
            ...state,
            entries
          };
        });
        if (options.database) {
          yield* options.database.memories.remove(options.namespace, key);
        }
      }),
    query: (query) =>
      Ref.get(memoryState).pipe(
        Effect.map((state) => queryMemory(state.entries, query))
      )
  };
}

function queryMemory(entries: Map<string, BackendMemoryEntry>, query: MemoryQuery): Record<string, unknown> {
  const values = Array.from(entries.values()).filter((entry) =>
    !query.prefix || entry.key.startsWith(query.prefix)
  );

  return Object.fromEntries(values.map((entry) => [entry.key, entry.value] as const));
}
