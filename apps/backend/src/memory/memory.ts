import { Context, Effect, Layer, Ref } from "effect";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { CorpusManager, MemoryManager, MemoryQuery, ReferenceText } from "@my-ai-orchestrator/core";
import { createBackendCorpusManager } from "./memory-corpus.js";
import { createBackendMemoryManager } from "./memory-store.js";

export interface BackendMemoryBundle {
  readonly memory: MemoryManager;
  readonly corpus: CorpusManager;
}

export class BackendMemoryBundleService extends Context.Tag("BackendMemoryBundleService")<
  BackendMemoryBundleService,
  BackendMemoryBundle
>() {}

export function createBackendMemoryBundleLayer(
  options: {
    readonly seedTexts?: readonly ReferenceText[];
    readonly database?: DatabaseClient;
    readonly namespace?: string;
  } = {}
) {
  return Layer.effect(BackendMemoryBundleService, createBackendMemoryBundleService(options));
}

export function createBackendMemoryBundleService(
  options: {
    readonly seedTexts?: readonly ReferenceText[];
    readonly database?: DatabaseClient;
    readonly namespace?: string;
  } = {}
): Effect.Effect<BackendMemoryBundle, never> {
  return Effect.gen(function* () {
    const seedTexts = options.seedTexts ?? defaultReferenceTexts();
    const namespace = options.namespace ?? "backend";
    const memoryState = yield* Ref.make(createBackendMemoryState(seedTexts));

    return {
      memory: createBackendMemoryManager(memoryState, {
        database: options.database,
        namespace
      }),
      corpus: createBackendCorpusManager(memoryState)
    };
  });
}

export interface BackendMemoryEntry {
  readonly key: string;
  value: unknown;
  updatedAt: string;
}

export interface BackendMemoryState {
  readonly entries: Map<string, BackendMemoryEntry>;
  readonly corpus: readonly ReferenceText[];
}

function createBackendMemoryState(seedTexts: readonly ReferenceText[]): BackendMemoryState {
  return {
    entries: new Map<string, BackendMemoryEntry>(),
    corpus: [...seedTexts]
  };
}

function defaultReferenceTexts(): readonly ReferenceText[] {
  return [
    {
      id: "migration-core",
      title: "Monorepo Migration Notes",
      content: "packages first, backend second, contracts typed",
      tags: ["migration", "architecture"],
      excerpt: "packages first",
      createdAt: "2026-05-11T00:00:00.000Z"
    }
  ];
}
