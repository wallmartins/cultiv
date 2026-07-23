import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { DatabaseError, type DatabaseClient } from "@my-ai-orchestrator/database";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import { AIAdapterTransportError } from "@my-ai-orchestrator/ai-adapters";
import type { BackendProviderTransport } from "../src/execution/pipeline/provider-transport.js";
import type {
  AIPolicyRoutingProfileDefinition,
  BackendAIPolicyServiceContract
} from "../src/product/ai-policy/ai-policy-types.js";
import { createBackendGenerationPrefillService } from "../src/product/generation/generation-prefill.js";

const DEFAULT_LLM_PROFILE: AIPolicyRoutingProfileDefinition = {
  id: "default-llm",
  preferredAttempts: [{ provider: "gemini", model: "gemini-3.1-flash-lite", timeoutMs: 12000 }],
  fallbackAttempts: [],
  operationalConstraints: { fallbackOn: ["transport_error", "timeout", "invalid_response"] }
};

function createAiPolicyStub(overrides?: Partial<BackendAIPolicyServiceContract>): BackendAIPolicyServiceContract {
  return {
    getActivePolicy: () =>
      Effect.succeed({
        version: "v1",
        lifecycle: "active",
        catalog: {} as never,
        contentTypes: {},
        routingProfiles: { "default-llm": DEFAULT_LLM_PROFILE },
        orchestrationCatalog: {} as never
      }),
    getActivePolicyPointer: () => Effect.die("not used"),
    getActiveOrchestrationCatalog: () => ({}) as never,
    listPolicyVersions: () => [],
    activatePolicyVersion: () => Effect.die("not used"),
    reloadActivePolicyPointer: () => Effect.die("not used"),
    recordDegradationSignal: () => Effect.die("not used"),
    recommendFuturePolicyVersion: () => Effect.die("not used"),
    listContentTypes: () => [],
    getCanonicalCreditCost: () => 0,
    validatePipelineRequest: () => Effect.die("not used"),
    resolvePricingEnvelope: () => Effect.die("not used"),
    resolveExecutionSnapshot: () => Effect.die("not used"),
    ...overrides
  };
}

const NOOP_PROVIDER_TRANSPORT = { complete: () => Effect.succeed(undefined) } as unknown as BackendProviderTransport;

// No persisted profile ⇒ the prefill degrades to the generic backbone (backboneGenerationSlots),
// which reproduces the four fixed angles these tests assert. The G4 slot path (profile present) is
// exercised in generation-prefill-slots.test.ts.
const NO_PROFILE_DATABASE = {
  practiceProfiles: { getByUser: () => Effect.succeed(undefined) }
} as unknown as DatabaseClient;

describe("generation prefill service", () => {
  it("falls back gracefully to the default response when the LLM call fails, without failing the flow", async () => {
    const aiAdapters: AIAdapterServiceContract = {
      complete: () => Effect.fail(new AIAdapterTransportError({ provider: "gemini", message: "timeout" }))
    };
    const service = createBackendGenerationPrefillService({
      database: NO_PROFILE_DATABASE,
      aiAdapters,
      providerTransport: NOOP_PROVIDER_TRANSPORT,
      aiPolicy: createAiPolicyStub()
    });

    const response = await Effect.runPromise(
      service.infer({ userId: "user-1", theme: "Por que times pequenos entregam mais rápido" })
    );

    expect(response.prefill.scope).toEqual({ lengthTier: "short" });
    expect(response.prefill.rhetoricalMode).toBeUndefined();
    expect(response.questionPlan).toHaveLength(4);
    expect(response.questionPlan.map((question) => question.angle)).toEqual([
      "thesis",
      "experience",
      "tension",
      "motivation"
    ]);
  });

  it("decodes a well-formed LLM response into the full response, including extra questions", async () => {
    const llmPayload = {
      lengthTier: "long",
      briefingSeed: "Como microsserviços afetam a velocidade de entrega.",
      extraQuestions: [{ prompt: "Que métrica você usaria para provar isso?" }]
    };
    const aiAdapters: AIAdapterServiceContract = {
      complete: (call) =>
        Effect.succeed({
          request: call.request,
          providerRequest: {} as never,
          response: {
            provider: call.request.provider,
            model: call.request.model,
            text: JSON.stringify(llmPayload)
          }
        })
    };
    const service = createBackendGenerationPrefillService({
      database: NO_PROFILE_DATABASE,
      aiAdapters,
      providerTransport: NOOP_PROVIDER_TRANSPORT,
      aiPolicy: createAiPolicyStub()
    });

    const response = await Effect.runPromise(
      service.infer({
        userId: "user-1",
        theme: "Como microsserviços afetam a velocidade de entrega no LinkedIn",
        language: "pt-BR"
      })
    );

    expect(response.prefill.scope).toEqual({ lengthTier: "long" });
    expect(response.prefill.briefing).toEqual({ topic: llmPayload.briefingSeed });
    expect(response.prefill.rhetoricalMode).toBeUndefined();
    expect(response.detectedPlatform).toBe("linkedin");
    expect(response.questionPlan).toHaveLength(5);
    expect(response.questionPlan.at(-1)).toMatchObject({ id: "extra-1", angle: "extra" });
  });

  it("falls back gracefully when the routing profile is missing, instead of failing", async () => {
    const aiAdapters: AIAdapterServiceContract = {
      complete: () => Effect.die("should not be called when there are no attempts")
    };
    const service = createBackendGenerationPrefillService({
      database: NO_PROFILE_DATABASE,
      aiAdapters,
      providerTransport: NOOP_PROVIDER_TRANSPORT,
      aiPolicy: createAiPolicyStub({
        getActivePolicy: () =>
          Effect.succeed({
            version: "v1",
            lifecycle: "active",
            catalog: {} as never,
            contentTypes: {},
            routingProfiles: {},
            orchestrationCatalog: {} as never
          })
      })
    });

    const response = await Effect.runPromise(service.infer({ userId: "user-1", theme: "Um tema qualquer" }));

    expect(response.prefill.scope).toEqual({ lengthTier: "short" });
    expect(response.prefill.rhetoricalMode).toBeUndefined();
  });

  it("fails the flow (does not fall back) when reading the active AI policy hits a genuine infra error", async () => {
    const aiAdapters: AIAdapterServiceContract = {
      complete: () => Effect.die("should not be called")
    };
    const service = createBackendGenerationPrefillService({
      database: NO_PROFILE_DATABASE,
      aiAdapters,
      providerTransport: NOOP_PROVIDER_TRANSPORT,
      aiPolicy: createAiPolicyStub({
        getActivePolicy: () =>
          Effect.fail(new DatabaseError({ operation: "getActivePolicy", message: "connection lost" }))
      })
    });

    const result = await Effect.runPromise(
      Effect.either(service.infer({ userId: "user-1", theme: "Um tema qualquer" }))
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("PrefillInferenceInfraError");
    }
  });
});
