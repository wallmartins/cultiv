import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createVoiceRebuildQueue } from "../src/product/voice/voice-rebuild-queue.js";
import type { BackendObservabilityService } from "../src/product/core/observability-types.js";

function createNoopObservability(): BackendObservabilityService {
  const noop = () => Effect.void;
  return {
    recordVoiceRebuildQueued: noop,
    recordVoiceRebuildStarted: noop,
    recordVoiceRebuildCompleted: noop,
    recordVoiceRebuildFailed: noop,
    recordVoiceBatchCommitted: noop,
    recordVoiceSnapshotPersisted: noop,
    recordVoiceRefreshEvent: noop,
    recordVoiceJudgeInvoked: noop,
    recordVoiceJudgeFallback: noop,
    recordVoiceReasoningExtractionFailed: noop,
    recordVoiceDevelopmentExtractionFailed: noop,
    recordVoiceSignatureReconciliationInvoked: noop,
    recordVoiceSignatureReconciliationSkipped: noop,
    recordVoiceSignatureReconciliationFailed: noop,
    recordTraitConfidenceComputed: noop,
    recordTraitConfirmationRecorded: noop,
    snapshot: () =>
      Effect.succeed({
        counters: {} as BackendObservabilityService extends { snapshot: () => Effect.Effect<infer S> } ? S extends { counters: infer C } ? C : never : never,
        events: []
      })
  };
}

describe("voice rebuild queue", () => {
  it("serializes rebuilds for the same user when scheduled while one is in flight", async () => {
    const processLog: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const queue = createVoiceRebuildQueue({
      now: () => new Date("2026-06-18T12:00:00.000Z"),
      observability: createNoopObservability(),
      processUserRebuild: (userId) =>
        Effect.gen(function* () {
          processLog.push(`start:${userId}`);
          if (processLog.length === 1) {
            yield* Effect.promise(() => firstGate);
          }
          processLog.push(`end:${userId}`);
        }),
      markRebuildQueued: () => Effect.void
    });

    Effect.runSync(queue.schedule("user-1"));
    Effect.runSync(queue.schedule("user-1"));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(processLog).toEqual(["start:user-1"]);

    releaseFirst?.();
    await Effect.runPromise(queue.drain("user-1"));

    expect(processLog).toEqual(["start:user-1", "end:user-1", "start:user-1", "end:user-1"]);
  });

  it("allows concurrent rebuilds for different users", async () => {
    const activeUsers = new Set<string>();
    let maxConcurrent = 0;

    const queue = createVoiceRebuildQueue({
      now: () => new Date("2026-06-18T12:00:00.000Z"),
      observability: createNoopObservability(),
      processUserRebuild: (userId) =>
        Effect.gen(function* () {
          activeUsers.add(userId);
          maxConcurrent = Math.max(maxConcurrent, activeUsers.size);
          yield* Effect.promise(() => new Promise((resolve) => setTimeout(resolve, 30)));
          activeUsers.delete(userId);
        }),
      markRebuildQueued: () => Effect.void
    });

    Effect.runSync(queue.schedule("user-a"));
    Effect.runSync(queue.schedule("user-b"));

    await Effect.runPromise(queue.drain());

    expect(maxConcurrent).toBe(2);
  });
});
