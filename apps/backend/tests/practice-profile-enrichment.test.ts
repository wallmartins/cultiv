import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import { AIAdapterTransportError } from "@my-ai-orchestrator/ai-adapters";
import { createDatabase, toPracticeProfileDiagnosticsDomain, toPracticeProfileDomain } from "@my-ai-orchestrator/database";
import type { PracticeProfile as DomainPracticeProfile } from "@my-ai-orchestrator/domain";
import type { BackendProviderTransport } from "../src/execution/pipeline/provider-transport.js";
import type { BackendAIPolicyServiceContract } from "../src/product/ai-policy/ai-policy-types.js";
import {
  enrichPracticeProfileForUser,
  PRACTICE_PROFILE_ROUTING_PROFILE_ID
} from "../src/product/practice-profile/index.js";

const NOOP_TRANSPORT = { complete: () => Effect.succeed(undefined) } as unknown as BackendProviderTransport;
const ATTEMPT = { provider: "gemini", model: "gemini-3.1-flash-lite", timeoutMs: 20000 };

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

function neverCalledAdapter(): AIAdapterServiceContract {
  return { complete: () => Effect.die("adapter should not be called") };
}

function policyWith(
  routingProfile: { readonly preferredAttempts: readonly typeof ATTEMPT[]; readonly fallbackAttempts: readonly typeof ATTEMPT[] } | undefined
): BackendAIPolicyServiceContract {
  return {
    getActivePolicy: () =>
      Effect.succeed({
        routingProfiles: routingProfile ? { [PRACTICE_PROFILE_ROUTING_PROFILE_ID]: routingProfile } : {}
      } as never)
  } as unknown as BackendAIPolicyServiceContract;
}

function neverCalledPolicy(): BackendAIPolicyServiceContract {
  return { getActivePolicy: () => Effect.die("policy should not be resolved") } as unknown as BackendAIPolicyServiceContract;
}

const AXES = {
  subject: "engenharia de software",
  vantagePoint: "eng. sênior que conduziu migrações em produção",
  audiences: ["engenheiros", "lideranças técnicas"]
};

const SEED_DIMENSIONS = {
  point: "A 2M linhas o join levava 40s; a tese é o tradeoff sob condições, não um veredito.",
  evidence: "Um postmortem de 2023 com p99 de 400ms na saga de cutover.",
  readerAssumption: "Liderança técnica já sabe o que é monólito; falta o contra-caso a 2M linhas.",
  resistance: "O steelman é o monólito chato que entrega em 99% dos casos.",
  stake: "Uma decisão de porta única que custa 3 trimestres se errar.",
  fieldCliche: "reescreve em Rust, best practices como encerra-debate",
  lexicon: ["monólito", "blast radius", "cutover"]
};

function seedProfile(userId: string, overrides: Partial<DomainPracticeProfile> = {}): DomainPracticeProfile {
  return {
    id: `practice-profile:${userId}`,
    userId,
    version: 1,
    depth: "seed",
    subject: AXES.subject,
    vantagePoint: AXES.vantagePoint,
    audiences: AXES.audiences,
    dimensions: SEED_DIMENSIONS,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides
  };
}

// One dimension (readerAssumption) and lexicon come back generic — the G5 niche-ask trigger.
const ENRICHED_PAYLOAD_WITH_THIN_DIM = JSON.stringify({
  fieldSpecifics: ["strangler fig pattern", "sharding em 2025"],
  dimensions: { ...SEED_DIMENSIONS, readerAssumption: "o leitor já sabe o básico do assunto.", lexicon: [] }
});

describe("practice profile enrichment (F3-5)", () => {
  it("deepens a seed profile, bumps its version, and persists the pending niche-ask dimensions", async () => {
    const database = createDatabase();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-1")));
    const { adapter } = scriptedAdapter([ENRICHED_PAYLOAD_WITH_THIN_DIM]);

    await Effect.runPromise(
      enrichPracticeProfileForUser(
        { database, now: () => new Date("2026-07-05T00:00:00.000Z"), aiAdapters: adapter, providerTransport: NOOP_TRANSPORT, aiPolicy: policyWith({ preferredAttempts: [ATTEMPT], fallbackAttempts: [] }) },
        "user-1",
        "pt-BR"
      )
    );

    const profileRecord = Effect.runSync(database.practiceProfiles.getByUser("user-1"));
    const profile = profileRecord && toPracticeProfileDomain(profileRecord);
    expect(profile?.depth).toBe("enriched");
    expect(profile?.version).toBe(2);
    expect(profile?.createdAt).toBe("2026-07-01T00:00:00.000Z");
    expect(profile?.updatedAt).toBe("2026-07-05T00:00:00.000Z");

    const diagnosticsRecord = Effect.runSync(database.practiceProfileDiagnostics.getByUser("user-1"));
    const diagnostics = diagnosticsRecord && toPracticeProfileDiagnosticsDomain(diagnosticsRecord);
    expect(diagnostics?.activeVersion).toBe(2);
    expect(diagnostics?.updating).toBe(false);
    expect([...(diagnostics?.pendingNicheAskDimensions ?? [])].sort()).toEqual(["lexicon", "readerAssumption"]);
  });

  it("keeps the seed profile untouched and does not throw when every provider attempt fails", async () => {
    const database = createDatabase();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-2")));
    const failingAdapter: AIAdapterServiceContract = {
      complete: () => Effect.fail(new AIAdapterTransportError({ provider: "gemini", message: "timeout" }))
    };

    await Effect.runPromise(
      enrichPracticeProfileForUser(
        { database, now: () => new Date(), aiAdapters: failingAdapter, providerTransport: NOOP_TRANSPORT, aiPolicy: policyWith({ preferredAttempts: [ATTEMPT], fallbackAttempts: [] }) },
        "user-2",
        "pt-BR"
      )
    );

    const profileRecord = Effect.runSync(database.practiceProfiles.getByUser("user-2"));
    const profile = profileRecord && toPracticeProfileDomain(profileRecord);
    expect(profile?.depth).toBe("seed");
    expect(profile?.version).toBe(1);
    const diagnosticsRecord = Effect.runSync(database.practiceProfileDiagnostics.getByUser("user-2"));
    expect(diagnosticsRecord).toBeUndefined();
  });

  it("skips an already-enriched profile without touching the provider chain (only-adds, runs once)", async () => {
    const database = createDatabase();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-3", { depth: "enriched", version: 2 })));

    await Effect.runPromise(
      enrichPracticeProfileForUser(
        { database, now: () => new Date(), aiAdapters: neverCalledAdapter(), providerTransport: NOOP_TRANSPORT, aiPolicy: neverCalledPolicy() },
        "user-3",
        "pt-BR"
      )
    );

    const profileRecord = Effect.runSync(database.practiceProfiles.getByUser("user-3"));
    const profile = profileRecord && toPracticeProfileDomain(profileRecord);
    expect(profile?.depth).toBe("enriched");
    expect(profile?.version).toBe(2);
  });

  it("no-ops when the user has no practice profile at all", async () => {
    const database = createDatabase();

    await Effect.runPromise(
      enrichPracticeProfileForUser(
        { database, now: () => new Date(), aiAdapters: neverCalledAdapter(), providerTransport: NOOP_TRANSPORT, aiPolicy: neverCalledPolicy() },
        "user-4",
        "pt-BR"
      )
    );

    expect(Effect.runSync(database.practiceProfiles.getByUser("user-4"))).toBeUndefined();
    expect(Effect.runSync(database.practiceProfileDiagnostics.getByUser("user-4"))).toBeUndefined();
  });

  it("no-ops when the practice-profile-llm routing profile has no attempts configured", async () => {
    const database = createDatabase();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-5")));

    await Effect.runPromise(
      enrichPracticeProfileForUser(
        { database, now: () => new Date(), aiAdapters: neverCalledAdapter(), providerTransport: NOOP_TRANSPORT, aiPolicy: policyWith(undefined) },
        "user-5",
        "pt-BR"
      )
    );

    const profileRecord = Effect.runSync(database.practiceProfiles.getByUser("user-5"));
    const profile = profileRecord && toPracticeProfileDomain(profileRecord);
    expect(profile?.depth).toBe("seed");
  });
});
