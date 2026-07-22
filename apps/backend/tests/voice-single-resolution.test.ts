import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { buildOrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import { resolveRuntimeSelectionContext } from "../src/execution/runtime-selection.js";
import type { ExecutePipelineOptions } from "../src/execution/runtime-types.js";
import type { BackendProductServices } from "../src/product.js";
import type { BackendVoiceService, EffectiveVoiceResolution } from "../src/product/voice/voice-types.js";
import { createBackendBillingService } from "../src/execution/billing.js";
import { createTestConfig } from "./test-helpers.js";

// FU-5 · the sync path must resolve the effective voice once. The availability gate resolves it and
// threads it via `preresolvedVoice`; the runtime must then reuse it rather than calling
// resolveEffectiveVoice again (each call persists its own voiceProfileSnapshots row).
const fakeVoice: EffectiveVoiceResolution = {
  voiceHints: {},
  metadata: {} as EffectiveVoiceResolution["metadata"]
};

function createRequest(): PipelineRequest {
  return {
    userId: "user-fu5",
    pipelineType: "serial-piece",
    contentType: "serial-piece",
    briefing: { topic: "FU-5 dedup", keyPoints: ["single resolution"] }
  } as PipelineRequest;
}

function makeHarness() {
  let resolveCalls = 0;
  const voice: BackendVoiceService = {
    getProfileScreen: () => Effect.succeed(undefined),
    recordTraitConfirmation: () => Effect.succeed(undefined),
    resolveEffectiveVoice: () => {
      resolveCalls += 1;
      return Effect.succeed(fakeVoice);
    }
  };
  const services = {
    billing: createBackendBillingService(),
    featureFlags: { isEnabled: () => false },
    voice
  } as unknown as BackendProductServices;

  const request = createRequest();
  const plan = buildOrchestrationPlan(request, {
    executionMode: "sync",
    qualityMode: "balanced",
    defaultLanguage: "pt-BR"
  });

  const options = (overrides: Partial<ExecutePipelineOptions> = {}): ExecutePipelineOptions => ({
    plan,
    request,
    config: createTestConfig(),
    now: () => new Date("2026-07-22T00:00:00.000Z"),
    includeTrace: false,
    services,
    simulateCredits: true,
    ...overrides
  });

  return { options, resolveCalls: () => resolveCalls };
}

describe("resolveRuntimeSelectionContext — single voice resolution (FU-5)", () => {
  it("resolves the voice itself when no pre-resolved voice is threaded", () => {
    const harness = makeHarness();
    const context = Effect.runSync(resolveRuntimeSelectionContext(harness.options()));

    expect(harness.resolveCalls()).toBe(1);
    expect(context.voice).toBe(fakeVoice);
  });

  it("reuses the pre-resolved voice without resolving a second time", () => {
    const harness = makeHarness();
    const preresolvedVoice: EffectiveVoiceResolution = { voiceHints: { tone: "wry" }, metadata: fakeVoice.metadata };

    const context = Effect.runSync(resolveRuntimeSelectionContext(harness.options({ preresolvedVoice })));

    expect(harness.resolveCalls()).toBe(0);
    expect(context.voice).toBe(preresolvedVoice);
  });
});
