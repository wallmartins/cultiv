import { Effect, Fiber, TestClock, TestContext } from "effect";
import { describe, expect, it } from "vitest";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import { toPracticeProfileRecord } from "@my-ai-orchestrator/database";
import type { PracticeProfile as DomainPracticeProfile } from "@my-ai-orchestrator/domain";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import { AIAdapterTransportError } from "@my-ai-orchestrator/ai-adapters";
import type { BackendProviderTransport } from "../src/execution/pipeline/provider-transport.js";
import type {
  AIPolicyRoutingProfileDefinition,
  BackendAIPolicyServiceContract
} from "../src/product/ai-policy/ai-policy-types.js";
import { createBackendGenerationPrefillService } from "../src/product/generation/generation-prefill.js";

const GEMINI = { provider: "gemini", model: "gemini-3.1-flash-lite", timeoutMs: 12000 } as const;
const DEFAULT_LLM: AIPolicyRoutingProfileDefinition = {
  id: "default-llm",
  preferredAttempts: [GEMINI],
  fallbackAttempts: [],
  operationalConstraints: { fallbackOn: ["transport_error", "timeout", "invalid_response"] }
};
const PRACTICE_LLM: AIPolicyRoutingProfileDefinition = {
  id: "practice-profile-llm",
  preferredAttempts: [GEMINI],
  fallbackAttempts: [],
  operationalConstraints: { fallbackOn: ["transport_error", "timeout", "invalid_response"] }
};

function aiPolicyStub(opts: { readonly practiceProfile?: boolean } = {}): BackendAIPolicyServiceContract {
  const routingProfiles = opts.practiceProfile === false
    ? { "default-llm": DEFAULT_LLM }
    : { "default-llm": DEFAULT_LLM, "practice-profile-llm": PRACTICE_LLM };
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

// Routes each LLM call by its declared purpose so the size/extras inference and the G4 slot generation
// stay independent of call order.
function purposeAdapter(byPurpose: Record<string, string | "fail">): AIAdapterServiceContract {
  return {
    complete: (call) => {
      const purpose = String((call.request.metadata as { purpose?: string })?.purpose ?? "");
      const scripted = byPurpose[purpose];
      if (scripted === undefined || scripted === "fail") {
        return Effect.fail(new AIAdapterTransportError({ provider: call.request.provider, message: "scripted failure" }));
      }
      return Effect.succeed({
        request: call.request,
        providerRequest: {} as never,
        response: { provider: call.request.provider, model: call.request.model, text: scripted }
      });
    }
  };
}

const DOMAIN_PROFILE: DomainPracticeProfile = {
  id: "practice-profile:user-1",
  userId: "user-1",
  version: 1,
  depth: "enriched",
  subject: "engenharia de plataforma",
  vantagePoint: "líder técnico que já migrou monólitos em produção",
  audiences: ["líderes de engenharia", "SREs"],
  dimensions: {
    point: "a tese sobre arquitetura que o líder precisa aceitar antes de agir",
    evidence: "um incidente de produção concreto, não experiência genérica",
    readerAssumption: "o líder sabe o que é monólito, não sabe quando modularizar vale",
    resistance: "o contraponto honesto: o monólito ainda escala com o time atual",
    stake: "por que decidir a arquitetura antes do próximo ciclo de contratação",
    fieldCliche: "reescreve em Rust, microserviços resolvem tudo",
    lexicon: ["monólito", "microserviço", "deploy", "SRE"]
  },
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z"
};

// Each slot names a concrete specific (a proper noun or a number) so it clears the G4 cliché-leak
// gate on the first pass — the same shape the marketing gold-standard fixture uses.
const SPECIFIC_SLOTS = {
  payload:
    "Qual tese sobre migrar do monólito você quer que o líder aceite — o caminho de módulos que a Shopify tomou, não microserviços?",
  anchor: "Que incidente concreto ancora isso — o deploy que derrubou o checkout e levou 45min pra reverter?",
  resistance: 'O contraponto honesto: "o monólito ainda escala com 12 engenheiros" ou virar um distribuído como o da Uber?',
  stake: "Por que decidir a arquitetura antes do Q3, antes de dobrar o time de 8 pra 16?"
};
const SLOTS_JSON = JSON.stringify({ slots: SPECIFIC_SLOTS });
const INFERENCE_JSON = JSON.stringify({ lengthTier: "short", extraQuestions: [] });

function databaseWith(record: unknown): DatabaseClient {
  return { practiceProfiles: { getByUser: () => Effect.succeed(record) } } as unknown as DatabaseClient;
}

function serviceWith(args: {
  readonly adapter: AIAdapterServiceContract;
  readonly database: DatabaseClient;
  readonly aiPolicy?: BackendAIPolicyServiceContract;
}) {
  return createBackendGenerationPrefillService({
    database: args.database,
    aiAdapters: args.adapter,
    providerTransport: NOOP_TRANSPORT,
    aiPolicy: args.aiPolicy ?? aiPolicyStub()
  });
}

// Immediate size/extras inference, but the G4 slot generation hangs forever — used with TestClock to
// prove the aggregate latency ceiling degrades to the backbone.
function hangingSlotsAdapter(): AIAdapterServiceContract {
  return {
    complete: (call) => {
      const purpose = String((call.request.metadata as { purpose?: string })?.purpose ?? "");
      if (purpose === "practice-profile-generation-slots") {
        return Effect.never;
      }
      return Effect.succeed({
        request: call.request,
        providerRequest: {} as never,
        response: { provider: call.request.provider, model: call.request.model, text: INFERENCE_JSON }
      });
    }
  };
}

describe("generation prefill — F4-3 G4 slot instantiation", () => {
  it("writes the four backbone questions from the profile's G4 slots when a profile exists", async () => {
    const record = toPracticeProfileRecord(DOMAIN_PROFILE, 1);
    const service = serviceWith({
      adapter: purposeAdapter({
        "generation-prefill-inference": INFERENCE_JSON,
        "practice-profile-generation-slots": SLOTS_JSON
      }),
      database: databaseWith(record)
    });

    const response = await Effect.runPromise(
      service.infer({ userId: "user-1", theme: "migrar do monólito", audience: "líderes de engenharia que decidem arquitetura" })
    );

    expect(response.questionPlan.map((q) => q.angle)).toEqual(["thesis", "experience", "tension", "motivation"]);
    expect(response.questionPlan[0]?.prompt).toBe(SPECIFIC_SLOTS.payload);
    expect(response.questionPlan[1]?.prompt).toBe(SPECIFIC_SLOTS.anchor);
    expect(response.questionPlan[2]?.prompt).toBe(SPECIFIC_SLOTS.resistance);
    expect(response.questionPlan[3]?.prompt).toBe(SPECIFIC_SLOTS.stake);
  });

  it("degrades to the generic backbone when G4 generation fails", async () => {
    const record = toPracticeProfileRecord(DOMAIN_PROFILE, 1);
    const service = serviceWith({
      adapter: purposeAdapter({
        "generation-prefill-inference": INFERENCE_JSON,
        "practice-profile-generation-slots": "fail"
      }),
      database: databaseWith(record)
    });

    const response = await Effect.runPromise(
      service.infer({ userId: "user-1", theme: "migrar do monólito" })
    );

    // The generic backbone copy (backboneGenerationSlots), not the profile-anchored slots.
    expect(response.questionPlan.map((q) => q.angle)).toEqual(["thesis", "experience", "tension", "motivation"]);
    expect(response.questionPlan[0]?.prompt).toContain("migrar do monólito");
    expect(response.questionPlan[0]?.prompt).not.toBe(SPECIFIC_SLOTS.payload);
  });

  it("degrades to the generic backbone when the author has no profile yet", async () => {
    const service = serviceWith({
      adapter: purposeAdapter({ "generation-prefill-inference": INFERENCE_JSON }),
      database: databaseWith(undefined)
    });

    const response = await Effect.runPromise(service.infer({ userId: "user-1", theme: "migrar do monólito" }));

    expect(response.questionPlan.map((q) => q.angle)).toEqual(["thesis", "experience", "tension", "motivation"]);
    expect(response.questionPlan[0]?.prompt).not.toBe(SPECIFIC_SLOTS.payload);
  });

  it("degrades to the generic backbone when the practice-profile routing profile is unconfigured", async () => {
    const record = toPracticeProfileRecord(DOMAIN_PROFILE, 1);
    const service = serviceWith({
      adapter: purposeAdapter({ "generation-prefill-inference": INFERENCE_JSON, "practice-profile-generation-slots": SLOTS_JSON }),
      database: databaseWith(record),
      aiPolicy: aiPolicyStub({ practiceProfile: false })
    });

    const response = await Effect.runPromise(service.infer({ userId: "user-1", theme: "migrar do monólito" }));

    expect(response.questionPlan[0]?.prompt).not.toBe(SPECIFIC_SLOTS.payload);
  });

  it("degrades to the generic backbone when the profile declares no audience and none is narrowed", async () => {
    const record = toPracticeProfileRecord({ ...DOMAIN_PROFILE, audiences: [] }, 1);
    const service = serviceWith({
      adapter: purposeAdapter({ "generation-prefill-inference": INFERENCE_JSON, "practice-profile-generation-slots": SLOTS_JSON }),
      database: databaseWith(record)
    });

    const response = await Effect.runPromise(service.infer({ userId: "user-1", theme: "migrar do monólito" }));

    expect(response.questionPlan[0]?.prompt).not.toBe(SPECIFIC_SLOTS.payload);
  });

  it("degrades to the backbone when G4 generation exceeds the latency budget (C-7 defect class)", async () => {
    const record = toPracticeProfileRecord(DOMAIN_PROFILE, 1);
    const service = serviceWith({ adapter: hangingSlotsAdapter(), database: databaseWith(record) });

    const response = await Effect.runPromise(
      Effect.gen(function* () {
        const fiber = yield* Effect.fork(service.infer({ userId: "user-1", theme: "migrar do monólito" }));
        yield* TestClock.adjust("46 seconds");
        return yield* Fiber.join(fiber);
      }).pipe(Effect.provide(TestContext.TestContext))
    );

    expect(response.questionPlan[0]?.prompt).not.toBe(SPECIFIC_SLOTS.payload);
    expect(response.questionPlan[0]?.prompt).toContain("migrar do monólito");
  });
});
