import { describe, expect, it } from "vitest";
import { foldTransition } from "@my-ai-orchestrator/shared";
import type { ExecutionStatusView } from "@my-ai-orchestrator/contracts";
import { mapSseEventToTransition } from "../../packages/client-sdk/src/execution-transitions.js";
import { executionFixture } from "./fixtures.js";

// Regression: SSE transitions never carry `snapshot` (only the polling fallback fills it), so the
// cache updater used to drop every SSE event — the ring stayed at 0% until a manual reload.
describe("foldTransition", () => {
  const running: ExecutionStatusView = executionFixture({
    jobId: "exec-1",
    status: "running",
    progress: { currentStep: "draft", stepIndex: 0, totalSteps: 4, percent: 25 },
    briefingTopic: "Tema",
    // The terminal SSE payload is only {content, metadata} — voice has to survive from the cache
    // or the alignment band would blank out the moment the job finishes.
    voice: {
      voiceProfileConfidence: "high",
      voiceAdaptationMode: "standard",
      voiceProfileVersionUsed: 3,
      voiceProfileSnapshotId: "snapshot-1",
      usedFallbackVoiceProfile: false,
      appliedSignals: { styleMarkers: ["first-person"], rules: [], antiPatterns: [] },
      pendingProfileRebuild: { status: "idle", nextActionCodes: [] }
    }
  });

  it("folds a snapshotless progress delta onto the cached view", () => {
    const folded = foldTransition(running, {
      type: "progressed",
      executionId: "exec-1",
      progress: { currentStep: "voice-align", stepIndex: 2, totalSteps: 4, percent: 75 },
      occurredAt: "2026-07-20T10:00:00.000Z"
    });

    expect(folded?.progress?.percent).toBe(75);
    expect(folded?.status).toBe("running");
    expect(folded?.briefingTopic).toBe("Tema");
  });

  it("folds a snapshotless completion so the reader opens without waiting for a refetch", () => {
    const folded = foldTransition(running, {
      type: "completed",
      executionId: "exec-1",
      result: { content: "Texto pronto.", metadata: {} },
      occurredAt: "2026-07-20T10:01:00.000Z"
    });

    expect(folded?.status).toBe("done");
    expect(folded?.result?.content).toBe("Texto pronto.");
    expect(folded?.completedAt).toBe("2026-07-20T10:01:00.000Z");
    // Fields the terminal SSE payload doesn't carry survive from the cached view.
    expect(folded?.voice).toEqual(running.voice);
  });

  it("prefers an explicit snapshot when the polling fallback supplies one", () => {
    const snapshot = executionFixture({ jobId: "exec-1", status: "done" });
    const folded = foldTransition(running, {
      type: "completed",
      executionId: "exec-1",
      snapshot,
      result: { content: "ignorado", metadata: {} },
      occurredAt: "2026-07-20T10:01:00.000Z"
    });

    expect(folded).toBe(snapshot);
  });

  // The defect lived in this seam: the mapper emits snapshotless transitions and the cache updater
  // required a snapshot, so every backend frame was discarded between them.
  it("carries a real backend SSE frame all the way to a moved progress ring", () => {
    const frame = {
      type: "progress" as const,
      payload: { currentStep: "refine", stepIndex: 3, totalSteps: 4, percent: 100 },
      occurredAt: "2026-07-20T10:02:00.000Z"
    };

    const transition = mapSseEventToTransition("exec-1", frame);
    expect(transition).toBeDefined();
    const folded = foldTransition(running, transition!);

    expect(folded?.progress?.percent).toBe(100);
    expect(folded?.progress?.currentStep).toBe("refine");
  });

  it("returns undefined when nothing is cached yet — nothing to fold onto", () => {
    const folded = foldTransition(undefined, {
      type: "progressed",
      executionId: "exec-1",
      progress: { currentStep: "draft", stepIndex: 1, totalSteps: 4, percent: 50 },
      occurredAt: "2026-07-20T10:00:00.000Z"
    });

    expect(folded).toBeUndefined();
  });
});
