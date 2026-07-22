import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import { AIAdapterTransportError } from "@my-ai-orchestrator/ai-adapters";
import type { BackendProviderTransport } from "../src/execution/pipeline/provider-transport.js";
import type {
  AIPolicyRoutingProfileDefinition,
  BackendAIPolicyServiceContract
} from "../src/product/ai-policy/ai-policy-types.js";
import { createBackendGenreInferenceService } from "../src/product/generation/genre-producer.js";

const DEFAULT_LLM_PROFILE: AIPolicyRoutingProfileDefinition = {
  id: "default-llm",
  preferredAttempts: [{ provider: "gemini", model: "gemini-3.1-flash-lite", timeoutMs: 12000 }],
  fallbackAttempts: [],
  operationalConstraints: { fallbackOn: ["transport_error", "timeout", "invalid_response"] }
};

function aiPolicyStub(routingProfiles: Record<string, AIPolicyRoutingProfileDefinition>): BackendAIPolicyServiceContract {
  return {
    getActivePolicy: () =>
      Effect.succeed({
        version: "v1",
        lifecycle: "active",
        catalog: {} as never,
        contentTypes: {},
        routingProfiles,
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
    resolveExecutionSnapshot: () => Effect.die("not used")
  };
}

const NOOP_TRANSPORT = { complete: () => Effect.succeed(undefined) } as unknown as BackendProviderTransport;

function scriptedAdapter(texts: readonly string[]): { adapter: AIAdapterServiceContract; calls: () => number } {
  let i = 0;
  const adapter: AIAdapterServiceContract = {
    complete: (call) =>
      Effect.sync(() => {
        const text = texts[Math.min(i, texts.length - 1)] ?? "";
        i += 1;
        return {
          request: call.request,
          providerRequest: {} as never,
          response: { provider: call.request.provider, model: call.request.model, text }
        };
      })
  };
  return { adapter, calls: () => i };
}

const PROMO_BRIEFING = {
  topic: "meu app de finanças",
  payload: "quero que o leitor instale o app e comece um teste grátis hoje",
  anchor: "posso mostrar que usuários economizam R$300/mês em média",
  resistance: "acham que já têm uma planilha que resolve",
  stake: "cada mês sem controle é dinheiro perdido"
};

function serviceWith(adapter: AIAdapterServiceContract, routingProfiles = { "default-llm": DEFAULT_LLM_PROFILE }) {
  return createBackendGenreInferenceService({
    aiAdapters: adapter,
    providerTransport: NOOP_TRANSPORT,
    aiPolicy: aiPolicyStub(routingProfiles)
  });
}

describe("genre producer (F4-7)", () => {
  it("infers the genre signature from a well-formed LLM response", async () => {
    const { adapter } = scriptedAdapter([
      JSON.stringify({
        rhetoricalMode: { dominant: "promote", secondary: "argue" },
        epistemicPosture: "promotional",
        prose: "promocional via prova de economia + CTA"
      })
    ]);

    const response = await Effect.runPromise(serviceWith(adapter).infer({ briefing: PROMO_BRIEFING }));

    expect(response.genre.rhetoricalMode.dominant).toBe("promote");
    expect(response.genre.rhetoricalMode.secondary).toBe("argue");
    expect(response.genre.epistemicPosture).toBe("promotional");
  });

  it("degrades to the default (expository) genre when the provider chain fails", async () => {
    const adapter: AIAdapterServiceContract = {
      complete: () => Effect.fail(new AIAdapterTransportError({ provider: "gemini", message: "timeout" }))
    };

    const response = await Effect.runPromise(serviceWith(adapter).infer({ briefing: PROMO_BRIEFING }));

    expect(response.genre.rhetoricalMode.dominant).toBe("expound");
    expect(response.genre.epistemicPosture).toBe("expository");
  });

  it("degrades on a malformed (non-schema) LLM response instead of throwing", async () => {
    const { adapter } = scriptedAdapter([JSON.stringify({ rhetoricalMode: { dominant: "not-a-mode" } })]);

    const response = await Effect.runPromise(serviceWith(adapter).infer({ briefing: PROMO_BRIEFING }));

    expect(response.genre.rhetoricalMode.dominant).toBe("expound");
  });

  it("returns the default genre without calling the model when the briefing is empty", async () => {
    const { adapter, calls } = scriptedAdapter(["{}"]);

    const response = await Effect.runPromise(serviceWith(adapter).infer({ briefing: {} }));

    expect(calls()).toBe(0);
    expect(response.genre.rhetoricalMode.dominant).toBe("expound");
  });

  it("degrades when no routing profile is configured, without calling the model", async () => {
    const { adapter, calls } = scriptedAdapter(["{}"]);

    const response = await Effect.runPromise(serviceWith(adapter, {}).infer({ briefing: PROMO_BRIEFING }));

    expect(calls()).toBe(0);
    expect(response.genre.rhetoricalMode.dominant).toBe("expound");
  });
});
