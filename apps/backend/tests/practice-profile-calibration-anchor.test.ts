import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import { AIAdapterTransportError } from "@my-ai-orchestrator/ai-adapters";
import type { PracticeProfile } from "@my-ai-orchestrator/contracts";
import { CALIBRATION_WIZARD_STEPS } from "@my-ai-orchestrator/domain";
import type { BackendProviderTransport } from "../src/execution/pipeline/provider-transport.js";
import type { PracticeProfileGenerationDeps } from "../src/product/practice-profile/index.js";
import {
  agnosticCalibrationAnchors,
  generateCalibrationAnchors
} from "../src/product/practice-profile/practice-profile-calibration-anchor.js";

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

const PROFILE: PracticeProfile = {
  userId: "u1",
  version: 1,
  depth: "seed",
  subject: "engenharia de software",
  vantagePoint: "eng. sênior que conduziu migrações em produção",
  audiences: ["engenheiros", "lideranças técnicas"],
  dimensions: {
    point: "A 2M linhas o join levava 40s; a tese é o tradeoff sob condições, não um veredito.",
    evidence: "Um postmortem de 2023 com p99 de 400ms na saga de cutover.",
    readerAssumption: "Liderança técnica já sabe o que é monólito; falta o contra-caso a 2M linhas.",
    resistance: "O steelman é o monólito chato que entrega em 99% dos casos.",
    stake: "Uma decisão de porta única que custa 3 trimestres se errar.",
    fieldCliche: "reescreve em Rust, best practices como encerra-debate",
    lexicon: ["monólito", "blast radius", "cutover"]
  }
};

const SPECIFIC_ANCHORS_PAYLOAD = JSON.stringify({
  anchors: {
    microOpinion: "Qual consenso sobre reescrever em Rust você acha que não sobrevive a produção com 2M linhas?",
    reasoningReflection:
      "Conte uma decisão de arquitetura sua que se mostrou errada num cutover de 2023 — o que o postmortem de p99 400ms mostrou que você não via?",
    argumentDevelopment:
      "Descreva como você conduz uma migração arriscada do começo ao fim — incluindo o ponto em que ficar no monólito de 2M linhas era a decisão certa.",
    formatAdaptation:
      "Explique pra alguém de fora da engenharia por que uma decisão de porta única que custa 3 trimestres não é só 'código feio'."
  }
});

const GENERIC_ANCHORS_PAYLOAD = JSON.stringify({
  anchors: {
    microOpinion: "fale sobre o seu tema de forma simples.",
    reasoningReflection: "conte sobre uma vez que você errou e aprendeu algo.",
    argumentDevelopment: "descreva uma decisão difícil que você tomou no seu trabalho.",
    formatAdaptation: "explique isso pra alguém que não conhece o assunto."
  }
});

describe("practice profile generator — G3 calibration anchor", () => {
  it("assembles the 4 fixed acts, in order, anchored in the generated prompts", async () => {
    const { adapter, calls } = scriptedAdapter([SPECIFIC_ANCHORS_PAYLOAD]);
    const anchors = await Effect.runPromise(
      generateCalibrationAnchors({ profile: PROFILE, locale: "pt-BR", deps: depsFor(adapter) })
    );

    expect(calls()).toBe(1);
    expect(anchors).toHaveLength(4);
    expect(anchors.map((a) => a.wizardStepId)).toEqual([
      "micro_opinion",
      "reasoning_reflection",
      "argument_development",
      "format_adaptation"
    ]);
    expect(anchors.map((a) => a.wordTarget)).toEqual([60, 150, 250, 180]);

    const parsed = JSON.parse(SPECIFIC_ANCHORS_PAYLOAD) as {
      anchors: Record<"microOpinion" | "reasoningReflection" | "argumentDevelopment" | "formatAdaptation", string>;
    };
    expect(anchors[0].prompt).toBe(parsed.anchors.microOpinion);
    expect(anchors[1].prompt).toBe(parsed.anchors.reasoningReflection);
    expect(anchors[2].prompt).toBe(parsed.anchors.argumentDevelopment);
    expect(anchors[3].prompt).toBe(parsed.anchors.formatAdaptation);
  });

  it("retries once against the cliché suffix when the whole batch reads as generic", async () => {
    const { adapter, calls } = scriptedAdapter([GENERIC_ANCHORS_PAYLOAD, SPECIFIC_ANCHORS_PAYLOAD]);
    const anchors = await Effect.runPromise(
      generateCalibrationAnchors({ profile: PROFILE, locale: "pt-BR", deps: depsFor(adapter) })
    );

    expect(calls()).toBe(2);
    const parsed = JSON.parse(SPECIFIC_ANCHORS_PAYLOAD) as { anchors: { microOpinion: string } };
    expect(anchors[0].prompt).toBe(parsed.anchors.microOpinion);
  });

  it("fails with a tagged error when every provider attempt is exhausted", async () => {
    const adapter: AIAdapterServiceContract = {
      complete: () => Effect.fail(new AIAdapterTransportError({ provider: "gemini", message: "timeout" }))
    };
    const exit = await Effect.runPromiseExit(
      generateCalibrationAnchors({ profile: PROFILE, locale: "pt-BR", deps: depsFor(adapter) })
    );

    expect(exit._tag).toBe("Failure");
  });
});

describe("practice profile generator — G3 agnostic degrade", () => {
  it("returns the 4 fixed acts with field-agnostic, non-empty prompts", () => {
    const anchors = agnosticCalibrationAnchors("pt-BR");

    expect(anchors).toHaveLength(4);
    expect(anchors.map((a) => a.wizardStepId)).toEqual([
      "micro_opinion",
      "reasoning_reflection",
      "argument_development",
      "format_adaptation"
    ]);
    expect(anchors.map((a) => a.wordTarget)).toEqual([60, 150, 250, 180]);
    for (const anchor of anchors) {
      expect(anchor.prompt.length).toBeGreaterThan(0);
    }
  });

  it("also has non-empty en-US wording, distinct from pt-BR", () => {
    const enAnchors = agnosticCalibrationAnchors("en-US");
    const ptAnchors = agnosticCalibrationAnchors("pt-BR");

    for (const anchor of enAnchors) {
      expect(anchor.prompt.length).toBeGreaterThan(0);
    }
    expect(enAnchors.map((a) => a.prompt)).not.toEqual(ptAnchors.map((a) => a.prompt));
  });

  // Drift guard: the acts' word targets are curated in this module but the wizard-step SSOT lives in
  // @my-ai-orchestrator/domain — if those diverge, calibration extensions silently disagree.
  it("keeps the calibration word targets in sync with the domain wizard-step SSOT", () => {
    for (const anchor of agnosticCalibrationAnchors("pt-BR")) {
      const step = CALIBRATION_WIZARD_STEPS.find((candidate) => candidate.id === anchor.wizardStepId);
      const targetWords = step && "targetWords" in step ? step.targetWords : undefined;
      expect(targetWords).toBe(anchor.wordTarget);
    }
  });
});
