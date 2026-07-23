import { Cause, Effect, Exit, Fiber, Option, TestClock, TestContext } from "effect";
import { describe, expect, it } from "vitest";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import { AIAdapterTransportError } from "@my-ai-orchestrator/ai-adapters";
import { createDatabase, toPracticeProfileDiagnosticsDomain, toPracticeProfileDomain } from "@my-ai-orchestrator/database";
import type {
  PracticeProfile as DomainPracticeProfile,
  PracticeProfileDiagnostics as DomainPracticeProfileDiagnostics
} from "@my-ai-orchestrator/domain";
import type { BackendProviderTransport } from "../src/execution/pipeline/provider-transport.js";
import type { BackendAIPolicyServiceContract } from "../src/product/ai-policy/ai-policy-types.js";
import {
  createBackendPracticeProfileService,
  practiceProfileDiagnosticsEntityId,
  PracticeProfileDerivationError,
  PracticeProfileValidationError,
  PRACTICE_PROFILE_ROUTING_PROFILE_ID
} from "../src/product/practice-profile/index.js";

const NOOP_TRANSPORT = { complete: () => Effect.succeed(undefined) } as unknown as BackendProviderTransport;
const ATTEMPT = { provider: "gemini", model: "gemini-3.1-flash-lite", timeoutMs: 20000 };

function scriptedAdapter(
  texts: readonly string[]
): { adapter: AIAdapterServiceContract; calls: () => number; userPrompts: () => readonly string[] } {
  let i = 0;
  const seenUserPrompts: string[] = [];
  const adapter: AIAdapterServiceContract = {
    complete: (call) =>
      Effect.sync(() => {
        const userMessage = call.request.messages.find((message) => message.role === "user");
        seenUserPrompts.push(userMessage?.content ?? "");
        const text = texts[Math.min(i, texts.length - 1)] ?? "";
        i += 1;
        return {
          request: call.request,
          providerRequest: {} as never,
          response: { provider: call.request.provider, model: call.request.model, text }
        };
      })
  };
  return { adapter, calls: () => i, userPrompts: () => seenUserPrompts };
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

const RESEED_DIMENSIONS = {
  point: "Trocar logs por tracing muda o que conta como debugar depois do incidente de 2024, não é modinha.",
  evidence: "Um span do Honeycomb achou a causa em 6 minutos onde os logs levaram 3 horas.",
  readerAssumption: "O time já usa logs estruturados desde 2022; falta o hábito de abrir 1 trace.",
  resistance: "O contraponto honesto: instrumentar 40 serviços custa 2 sprints de trabalho.",
  stake: "Sem trace, o próximo incidente sério vira uma caça ao tesouro de 6 horas.",
  fieldCliche: "observabilidade é só um dashboard bonito no Grafana",
  lexicon: ["span", "trace context", "cardinalidade"]
};

const RESEED_PAYLOAD = JSON.stringify({
  fieldSpecifics: ["Charity Majors on high-cardinality traces", "incidente de outubro de 2024"],
  dimensions: RESEED_DIMENSIONS
});

function seedProfile(userId: string, overrides: Partial<DomainPracticeProfile> = {}): DomainPracticeProfile {
  return {
    id: `practice-profile:${userId}`,
    userId,
    version: 2,
    depth: "enriched",
    subject: AXES.subject,
    vantagePoint: AXES.vantagePoint,
    audiences: AXES.audiences,
    dimensions: SEED_DIMENSIONS,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides
  };
}

function diagnosticsFixture(
  userId: string,
  overrides: Partial<DomainPracticeProfileDiagnostics> = {}
): DomainPracticeProfileDiagnostics {
  return {
    id: practiceProfileDiagnosticsEntityId(userId),
    userId,
    activeVersion: 2,
    updating: false,
    pendingNicheAskDimensions: [],
    enrichmentSuggestions: {},
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides
  };
}

function createServices(now: () => Date = () => new Date("2026-07-10T00:00:00.000Z")) {
  const database = createDatabase();
  return {
    database,
    withAdapter(
      adapter: AIAdapterServiceContract,
      policy: BackendAIPolicyServiceContract = policyWith({ preferredAttempts: [ATTEMPT], fallbackAttempts: [] })
    ) {
      return createBackendPracticeProfileService({
        database,
        now,
        aiAdapters: adapter,
        providerTransport: NOOP_TRANSPORT,
        aiPolicy: policy
      });
    }
  };
}

describe("practice profile identity read (F5-1)", () => {
  it("builds the curated niche-ask when dimensions are pending, leaking none of the raw dimensions", async () => {
    const { database, withAdapter } = createServices();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-1")));
    Effect.runSync(
      database.practiceProfileDiagnostics.put(
        diagnosticsFixture("user-1", { pendingNicheAskDimensions: ["lexicon", "stake"] })
      )
    );

    const service = withAdapter(neverCalledAdapter());
    const response = await Effect.runPromise(service.resolveIdentity("user-1", "pt-BR"));

    expect(response.profile?.nicheAsk?.question).toContain(AXES.subject);
    // The dimension keys stay server-side — only the curated question crosses the wire (ADR §2).
    expect(response.profile?.nicheAsk).not.toHaveProperty("dimensions");
    expect(response.profile).not.toHaveProperty("dimensions");
    expect(JSON.stringify(response)).not.toContain(SEED_DIMENSIONS.fieldCliche);
  });

  it("returns a null niche-ask when nothing is pending", async () => {
    const { database, withAdapter } = createServices();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-2")));

    const service = withAdapter(neverCalledAdapter());
    const response = await Effect.runPromise(service.resolveIdentity("user-2", "pt-BR"));

    expect(response.profile?.nicheAsk).toBeNull();
  });

  it("returns a null profile when the author has no practice profile yet", async () => {
    const { withAdapter } = createServices();
    const service = withAdapter(neverCalledAdapter());
    const response = await Effect.runPromise(service.resolveIdentity("user-3", "pt-BR"));

    expect(response).toEqual({ profile: null });
  });
});

describe("update declared axes — cosmetic reuse (F5-2a)", () => {
  it("persists the new surface form without re-seeding on a case/order/dup-only change", async () => {
    const { database, withAdapter } = createServices();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-4")));
    Effect.runSync(
      database.practiceProfileDiagnostics.put(
        diagnosticsFixture("user-4", { pendingNicheAskDimensions: ["lexicon"] })
      )
    );

    const service = withAdapter(neverCalledAdapter());
    const response = await Effect.runPromise(
      service.updateDeclaredAxes(
        "user-4",
        {
          subject: AXES.subject,
          vantagePoint: AXES.vantagePoint,
          audiences: ["Lideranças Técnicas", "engenheiros", "Engenheiros"]
        },
        "pt-BR"
      )
    );

    const profileRecord = Effect.runSync(database.practiceProfiles.getByUser("user-4"));
    const profile = profileRecord && toPracticeProfileDomain(profileRecord);
    expect(profile?.version).toBe(2);
    expect(profile?.depth).toBe("enriched");
    expect(profile?.dimensions).toEqual(SEED_DIMENSIONS);
    expect(profile?.audiences).toEqual(["Lideranças Técnicas", "engenheiros", "Engenheiros"]);
    expect(profile?.createdAt).toBe("2026-07-01T00:00:00.000Z");
    expect(profile?.updatedAt).toBe("2026-07-10T00:00:00.000Z");

    const diagnosticsRecord = Effect.runSync(database.practiceProfileDiagnostics.getByUser("user-4"));
    const diagnostics = diagnosticsRecord && toPracticeProfileDiagnosticsDomain(diagnosticsRecord);
    expect(diagnostics?.pendingNicheAskDimensions).toEqual(["lexicon"]);
    expect(diagnostics?.updatedAt).toBe("2026-07-01T00:00:00.000Z");

    expect(response?.profile?.audiences).toEqual(["Lideranças Técnicas", "engenheiros", "Engenheiros"]);
  });
});

describe("update declared axes — material re-seed (F5-2a via C-1)", () => {
  it("re-seeds the profile and resets the pending niche-ask when an axis materially changes", async () => {
    const { database, withAdapter } = createServices();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-5")));
    Effect.runSync(
      database.practiceProfileDiagnostics.put(
        diagnosticsFixture("user-5", {
          pendingNicheAskDimensions: ["lexicon"],
          enrichmentSuggestions: { point: { response: "accepted", recordedAt: "2026-07-02T00:00:00.000Z" } }
        })
      )
    );

    const { adapter, calls } = scriptedAdapter([RESEED_PAYLOAD]);
    const service = withAdapter(adapter);
    const response = await Effect.runPromise(
      service.updateDeclaredAxes(
        "user-5",
        { subject: "observabilidade em produção", vantagePoint: AXES.vantagePoint, audiences: AXES.audiences },
        "pt-BR"
      )
    );

    expect(calls()).toBe(1);
    const profileRecord = Effect.runSync(database.practiceProfiles.getByUser("user-5"));
    const profile = profileRecord && toPracticeProfileDomain(profileRecord);
    expect(profile?.version).toBe(3);
    expect(profile?.depth).toBe("seed");
    expect(profile?.subject).toBe("observabilidade em produção");
    expect(profile?.dimensions).toEqual(RESEED_DIMENSIONS);
    expect(profile?.createdAt).toBe("2026-07-01T00:00:00.000Z");
    expect(profile?.updatedAt).toBe("2026-07-10T00:00:00.000Z");

    const diagnosticsRecord = Effect.runSync(database.practiceProfileDiagnostics.getByUser("user-5"));
    const diagnostics = diagnosticsRecord && toPracticeProfileDiagnosticsDomain(diagnosticsRecord);
    expect(diagnostics?.activeVersion).toBe(3);
    expect(diagnostics?.pendingNicheAskDimensions).toEqual([]);
    expect(diagnostics?.enrichmentSuggestions?.point?.response).toBe("accepted");

    expect(response?.profile?.nicheAsk).toBeNull();
    expect(response?.profile?.depth).toBe("seed");
  });

  it("fails validation and leaves the stored profile untouched when an axis is blank", async () => {
    const { database, withAdapter } = createServices();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-6")));

    const service = withAdapter(neverCalledAdapter());
    const exit = await Effect.runPromiseExit(
      service.updateDeclaredAxes("user-6", { subject: "   ", vantagePoint: AXES.vantagePoint, audiences: AXES.audiences }, "pt-BR")
    );

    expect(Exit.isFailure(exit)).toBe(true);
    const failure = Exit.isFailure(exit) ? Cause.failureOption(exit.cause) : Option.none();
    expect(Option.getOrUndefined(failure)).toBeInstanceOf(PracticeProfileValidationError);

    const profileRecord = Effect.runSync(database.practiceProfiles.getByUser("user-6"));
    expect(profileRecord?.updatedAt).toBe("2026-07-01T00:00:00.000Z");
  });

  it("returns undefined when the author has no profile yet", async () => {
    const { withAdapter } = createServices();
    const service = withAdapter(neverCalledAdapter());
    const response = await Effect.runPromise(service.updateDeclaredAxes("user-7", AXES, "pt-BR"));

    expect(response).toBeUndefined();
  });

  // C-7 class: an aggregate ceiling over the re-seed — a hanging provider chain fails through
  // PracticeProfileDerivationError instead of holding the /voice request open, and the stored
  // profile is never touched (put only runs after a successful re-seed).
  it("times out the re-seed and leaves the stored profile untouched", async () => {
    const { database, withAdapter } = createServices();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-8")));

    const hangingAdapter: AIAdapterServiceContract = { complete: () => Effect.never };
    const service = withAdapter(hangingAdapter);

    const exit = await Effect.runPromise(
      Effect.gen(function* () {
        const fiber = yield* Effect.fork(
          Effect.exit(
            service.updateDeclaredAxes(
              "user-8",
              { subject: "observabilidade em produção", vantagePoint: AXES.vantagePoint, audiences: AXES.audiences },
              "pt-BR"
            )
          )
        );
        yield* TestClock.adjust("61 seconds");
        return yield* Fiber.join(fiber);
      }).pipe(Effect.provide(TestContext.TestContext))
    );

    expect(Exit.isFailure(exit)).toBe(true);
    const failure = Exit.isFailure(exit) ? Cause.failureOption(exit.cause) : Option.none();
    const error = Option.getOrUndefined(failure);
    expect(error).toBeInstanceOf(PracticeProfileDerivationError);
    expect((error as PracticeProfileDerivationError).message).toContain("timed out");

    const profileRecord = Effect.runSync(database.practiceProfiles.getByUser("user-8"));
    const profile = profileRecord && toPracticeProfileDomain(profileRecord);
    expect(profile?.version).toBe(2);
    expect(profile?.subject).toBe(AXES.subject);
  });
});

describe("niche-ask response (F5-2b/F5-3)", () => {
  it("dismiss records rejected suggestions, clears the pending ask, and leaves the profile untouched", async () => {
    const { database, withAdapter } = createServices();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-9")));
    Effect.runSync(
      database.practiceProfileDiagnostics.put(
        diagnosticsFixture("user-9", { pendingNicheAskDimensions: ["lexicon", "stake"] })
      )
    );

    const service = withAdapter(neverCalledAdapter());
    const response = await Effect.runPromise(service.respondToNicheAsk("user-9", { action: "dismiss" }, "pt-BR"));

    const diagnosticsRecord = Effect.runSync(database.practiceProfileDiagnostics.getByUser("user-9"));
    const diagnostics = diagnosticsRecord && toPracticeProfileDiagnosticsDomain(diagnosticsRecord);
    expect(diagnostics?.pendingNicheAskDimensions).toEqual([]);
    expect(diagnostics?.enrichmentSuggestions?.lexicon).toEqual({
      response: "rejected",
      recordedAt: "2026-07-10T00:00:00.000Z"
    });
    expect(diagnostics?.enrichmentSuggestions?.stake?.response).toBe("rejected");

    const profileRecord = Effect.runSync(database.practiceProfiles.getByUser("user-9"));
    const profile = profileRecord && toPracticeProfileDomain(profileRecord);
    expect(profile?.version).toBe(2);
    expect(profile?.dimensions).toEqual(SEED_DIMENSIONS);
    expect(response.profile?.nicheAsk).toBeNull();
  });

  it("answer re-enriches with the author's specifics threaded into the prompt", async () => {
    const { database, withAdapter } = createServices();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-10")));
    Effect.runSync(
      database.practiceProfileDiagnostics.put(
        diagnosticsFixture("user-10", { pendingNicheAskDimensions: ["lexicon", "readerAssumption"] })
      )
    );

    const { adapter, userPrompts } = scriptedAdapter([RESEED_PAYLOAD]);
    const service = withAdapter(adapter);
    const answerText = "Eu sigo o Charity Majors e o pessoal do incidente de outubro de 2024.";
    const response = await Effect.runPromise(
      service.respondToNicheAsk("user-10", { action: "answer", answer: answerText }, "pt-BR")
    );

    expect(userPrompts().some((prompt) => prompt.includes(answerText))).toBe(true);

    const profileRecord = Effect.runSync(database.practiceProfiles.getByUser("user-10"));
    const profile = profileRecord && toPracticeProfileDomain(profileRecord);
    expect(profile?.version).toBe(3);
    expect(profile?.depth).toBe("enriched");
    expect(profile?.dimensions).toEqual(RESEED_DIMENSIONS);

    const diagnosticsRecord = Effect.runSync(database.practiceProfileDiagnostics.getByUser("user-10"));
    const diagnostics = diagnosticsRecord && toPracticeProfileDiagnosticsDomain(diagnosticsRecord);
    expect(diagnostics?.activeVersion).toBe(3);
    expect(diagnostics?.pendingNicheAskDimensions).toEqual([]);
    expect(diagnostics?.enrichmentSuggestions?.lexicon?.response).toBe("accepted");
    expect(diagnostics?.enrichmentSuggestions?.readerAssumption?.response).toBe("accepted");
    expect(response.profile?.depth).toBe("enriched");
  });

  it("answer degrades when re-enrichment fails, leaving the ask pending and the profile untouched", async () => {
    const { database, withAdapter } = createServices();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-11")));
    Effect.runSync(
      database.practiceProfileDiagnostics.put(diagnosticsFixture("user-11", { pendingNicheAskDimensions: ["stake"] }))
    );

    const failingAdapter: AIAdapterServiceContract = {
      complete: () => Effect.fail(new AIAdapterTransportError({ provider: "gemini", message: "timeout" }))
    };
    const service = withAdapter(failingAdapter);
    const response = await Effect.runPromise(
      service.respondToNicheAsk("user-11", { action: "answer", answer: "não sei dizer" }, "pt-BR")
    );

    const profileRecord = Effect.runSync(database.practiceProfiles.getByUser("user-11"));
    const profile = profileRecord && toPracticeProfileDomain(profileRecord);
    expect(profile?.version).toBe(2);
    expect(profile?.dimensions).toEqual(SEED_DIMENSIONS);

    // Nothing recorded, ask still pending: a failed provider call is retryable, not a resolved ask.
    const diagnosticsRecord = Effect.runSync(database.practiceProfileDiagnostics.getByUser("user-11"));
    const diagnostics = diagnosticsRecord && toPracticeProfileDiagnosticsDomain(diagnosticsRecord);
    expect(diagnostics?.activeVersion).toBe(2);
    expect(diagnostics?.pendingNicheAskDimensions).toEqual(["stake"]);
    expect(diagnostics?.enrichmentSuggestions?.stake).toBeUndefined();
    expect(response.profile?.nicheAsk).not.toBeNull();
  });

  // C-7 class: the 45s re-enrichment ceiling degrades through the exact same path as a provider
  // failure (Effect.timeoutFail feeds the same Effect.either) — the profile is never touched and the
  // ask stays pending for a retry.
  it("answer degrades when re-enrichment times out, leaving the ask pending and the profile untouched", async () => {
    const { database, withAdapter } = createServices();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-13")));
    Effect.runSync(
      database.practiceProfileDiagnostics.put(diagnosticsFixture("user-13", { pendingNicheAskDimensions: ["stake"] }))
    );

    const hangingAdapter: AIAdapterServiceContract = { complete: () => Effect.never };
    const service = withAdapter(hangingAdapter);

    const exit = await Effect.runPromise(
      Effect.gen(function* () {
        const fiber = yield* Effect.fork(
          Effect.exit(service.respondToNicheAsk("user-13", { action: "answer", answer: "não sei dizer" }, "pt-BR"))
        );
        yield* TestClock.adjust("46 seconds");
        return yield* Fiber.join(fiber);
      }).pipe(Effect.provide(TestContext.TestContext))
    );

    expect(Exit.isSuccess(exit)).toBe(true);
    const response = Exit.isSuccess(exit) ? exit.value : undefined;
    expect(response?.profile?.nicheAsk).not.toBeNull();

    const profileRecord = Effect.runSync(database.practiceProfiles.getByUser("user-13"));
    const profile = profileRecord && toPracticeProfileDomain(profileRecord);
    expect(profile?.version).toBe(2);

    const diagnosticsRecord = Effect.runSync(database.practiceProfileDiagnostics.getByUser("user-13"));
    const diagnostics = diagnosticsRecord && toPracticeProfileDiagnosticsDomain(diagnosticsRecord);
    expect(diagnostics?.pendingNicheAskDimensions).toEqual(["stake"]);
    expect(diagnostics?.enrichmentSuggestions?.stake).toBeUndefined();
  });

  it("no-ops when there is no pending niche-ask", async () => {
    const { database, withAdapter } = createServices();
    Effect.runSync(database.practiceProfiles.put(seedProfile("user-12")));

    const service = withAdapter(neverCalledAdapter());
    const response = await Effect.runPromise(service.respondToNicheAsk("user-12", { action: "dismiss" }, "pt-BR"));

    expect(response.profile?.nicheAsk).toBeNull();
    expect(Effect.runSync(database.practiceProfileDiagnostics.getByUser("user-12"))).toBeUndefined();
  });
});
