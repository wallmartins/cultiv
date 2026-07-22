import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import { AIAdapterTransportError } from "@my-ai-orchestrator/ai-adapters";
import type { PracticeProfile } from "@my-ai-orchestrator/contracts";
import type { BackendProviderTransport } from "../src/execution/pipeline/provider-transport.js";
import type { PracticeProfileGenerationDeps } from "../src/product/practice-profile/index.js";
import {
  buildNicheAsk,
  enrichPracticeProfile,
  generateSeedPracticeProfile
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

function depsFor(adapter: AIAdapterServiceContract): PracticeProfileGenerationDeps {
  return { attempts: [ATTEMPT], aiAdapters: adapter, providerTransport: NOOP_TRANSPORT };
}

const SPECIFIC_DIMENSIONS = {
  point: "A 2M linhas o join levava 40s; a tese é o tradeoff sob condições, não um veredito.",
  evidence: "Um postmortem de 2023 com p99 de 400ms na saga de cutover.",
  readerAssumption: "Liderança técnica já sabe o que é monólito; falta o contra-caso a 2M linhas.",
  resistance: "O steelman é o monólito chato que entrega em 99% dos casos.",
  stake: "Uma decisão de porta única que custa 3 trimestres se errar.",
  fieldCliche: "reescreve em Rust, best practices como encerra-debate",
  lexicon: ["monólito", "blast radius", "cutover"]
};

const SPECIFIC_PAYLOAD = JSON.stringify({
  fieldSpecifics: ["strangler fig pattern", "Fowler on monolith-first", "join de 40s"],
  dimensions: SPECIFIC_DIMENSIONS
});

const GENERIC_PAYLOAD = JSON.stringify({
  fieldSpecifics: [],
  dimensions: {
    point: "é importante agregar valor para o leitor.",
    evidence: "mostre exemplos relevantes.",
    readerAssumption: "o leitor já sabe o básico.",
    resistance: "pense fora da caixa.",
    stake: "isso importa muito.",
    fieldCliche: "seja autêntico",
    lexicon: []
  }
});

const AXES = {
  subject: "engenharia de software",
  vantagePoint: "eng. sênior que conduziu migrações em produção",
  audiences: ["engenheiros", "lideranças técnicas"]
};

describe("practice profile generator — G1 seed", () => {
  it("assembles a seed profile from the declared axes and the LLM dimensions", async () => {
    const { adapter, calls } = scriptedAdapter([SPECIFIC_PAYLOAD]);
    const profile = await Effect.runPromise(
      generateSeedPracticeProfile({ userId: "u1", version: 1, axes: AXES, locale: "pt-BR", deps: depsFor(adapter) })
    );

    expect(calls()).toBe(1);
    expect(profile.depth).toBe("seed");
    expect(profile.userId).toBe("u1");
    expect(profile.version).toBe(1);
    expect(profile.subject).toBe(AXES.subject);
    expect(profile.vantagePoint).toBe(AXES.vantagePoint);
    expect(profile.audiences).toEqual(AXES.audiences);
    expect(profile.dimensions).toEqual(SPECIFIC_DIMENSIONS);
  });

  it("retries once against the cliché suffix when the first fill reads as generic", async () => {
    const { adapter, calls } = scriptedAdapter([GENERIC_PAYLOAD, SPECIFIC_PAYLOAD]);
    const profile = await Effect.runPromise(
      generateSeedPracticeProfile({ userId: "u1", version: 1, axes: AXES, locale: "pt-BR", deps: depsFor(adapter) })
    );

    expect(calls()).toBe(2);
    expect(profile.dimensions.point).toBe(SPECIFIC_DIMENSIONS.point);
  });

  it("fails with a tagged error when every provider attempt is exhausted", async () => {
    const adapter: AIAdapterServiceContract = {
      complete: () => Effect.fail(new AIAdapterTransportError({ provider: "gemini", message: "timeout" }))
    };
    const exit = await Effect.runPromiseExit(
      generateSeedPracticeProfile({ userId: "u1", version: 1, axes: AXES, locale: "pt-BR", deps: depsFor(adapter) })
    );

    expect(exit._tag).toBe("Failure");
  });
});

describe("practice profile generator — G2 enrichment", () => {
  const seedProfile: PracticeProfile = {
    userId: "u1",
    version: 3,
    depth: "seed",
    subject: AXES.subject,
    vantagePoint: AXES.vantagePoint,
    audiences: AXES.audiences,
    dimensions: SPECIFIC_DIMENSIONS
  };

  it("returns an enriched profile that preserves the declared axes and identity", async () => {
    const { adapter } = scriptedAdapter([SPECIFIC_PAYLOAD]);
    const { profile, thinDimensions } = await Effect.runPromise(
      enrichPracticeProfile({ seedProfile, locale: "pt-BR", deps: depsFor(adapter) })
    );

    expect(profile.depth).toBe("enriched");
    expect(profile.userId).toBe("u1");
    expect(profile.version).toBe(3);
    expect(profile.subject).toBe(AXES.subject);
    expect(thinDimensions).toEqual([]);
  });

  it("flags dimensions that come back without a named specific as thin (the G5 trigger)", async () => {
    const thinPayload = JSON.stringify({
      fieldSpecifics: ["strangler fig", "join de 40s"],
      dimensions: { ...SPECIFIC_DIMENSIONS, readerAssumption: "o leitor já sabe o básico do assunto.", lexicon: [] }
    });
    const { adapter } = scriptedAdapter([thinPayload]);
    const { thinDimensions } = await Effect.runPromise(
      enrichPracticeProfile({ seedProfile, locale: "pt-BR", deps: depsFor(adapter) })
    );

    expect([...thinDimensions].sort()).toEqual(["lexicon", "readerAssumption"]);
  });
});

describe("practice profile generator — G5 niche-ask", () => {
  it("builds a curated question for the thin dimensions", () => {
    const ask = buildNicheAsk({ subject: "direito tributário", thinDimensions: ["lexicon", "resistance"], locale: "pt-BR" });
    expect(ask?.dimensions).toEqual(["lexicon", "resistance"]);
    expect(ask?.question).toContain("direito tributário");
    expect(ask?.question.split("\n")).toHaveLength(3);
  });

  it("returns undefined when nothing is thin", () => {
    expect(buildNicheAsk({ subject: "x", thinDimensions: [], locale: "en-US" })).toBeUndefined();
  });
});
