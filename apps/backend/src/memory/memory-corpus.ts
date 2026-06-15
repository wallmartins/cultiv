import { Effect, Ref } from "effect";
import type { CorpusManager, ReferenceText } from "@my-ai-orchestrator/core";
import type { BackendMemoryState } from "./memory.js";

export function createBackendCorpusManager(
  memoryState: Ref.Ref<BackendMemoryState>
): CorpusManager {
  return {
    getById: (id) =>
      Ref.get(memoryState).pipe(
        Effect.map((state) => state.corpus.find((entry) => entry.id === id))
      ),
    queryByTag: (tag) =>
      Ref.get(memoryState).pipe(
        Effect.map((state) => state.corpus.filter((entry) => entry.tags?.includes(tag)))
      ),
    queryByPrefix: (prefix) =>
      Ref.get(memoryState).pipe(
        Effect.map((state) => state.corpus.filter((entry) => entry.id.startsWith(prefix)))
      )
  };
}
