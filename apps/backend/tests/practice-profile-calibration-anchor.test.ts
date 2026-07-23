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

function scriptedAdapter(texts: readonly string[]): {
  adapter: AIAdapterServiceContract;
  calls: () => number;
  prompts: () => readonly { system: string; user: string }[];
} {
  let i = 0;
  const captured: { system: string; user: string }[] = [];
  const adapter: AIAdapterServiceContract = {
    complete: (call) =>
      Effect.sync(() => {
        const text = texts[Math.min(i, texts.length - 1)] ?? "";
        i += 1;
        const messages = call.request.messages as readonly { role: string; content: string }[];
        captured.push({
          system: messages.find((m) => m.role === "system")?.content ?? "",
          user: messages.find((m) => m.role === "user")?.content ?? ""
        });
        return {
          request: call.request,
          providerRequest: {} as never,
          response: { provider: call.request.provider, model: call.request.model, text }
        };
      })
  };
  return { adapter, calls: () => i, prompts: () => captured };
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

// The corrected style: each question is shaped by the field (software engineering) but names no proper
// noun/number — the concrete case belongs in the author's answer, so it reads answerable off the top of
// the head. Under the eliciting gate this passes on the first attempt (namesSpecific no longer gates it).
const ELICITING_ANCHORS_PAYLOAD = JSON.stringify({
  anchors: {
    microOpinion:
      "Qual prática consagrada em arquitetura de sistemas você acha que raramente se justifica na prática?",
    reasoningReflection:
      "Conte sobre uma decisão de arquitetura sua que se mostrou errada — o que só ficou claro quando algo quebrou em produção?",
    argumentDevelopment:
      "Descreva do começo ao fim uma migração arriscada que você conduziu, incluindo o ponto em que ficar no que já existia era a decisão certa.",
    formatAdaptation:
      "Explique para alguém de fora da engenharia um conceito que toda liderança técnica trata como óbvio, e por que ele importa."
  }
});

// A dead-cliché batch: post-fix the only thing that still gates a question is the filler-phrase blocklist
// ("agregar valor"), not the proper-noun proxy — a generic-but-clean elicited question is now accepted.
const FILLER_ANCHORS_PAYLOAD = JSON.stringify({
  anchors: {
    microOpinion: "Como você pensa em agregar valor no seu trabalho?",
    reasoningReflection: "Conte sobre uma vez que você errou e aprendeu algo.",
    argumentDevelopment: "Descreva uma decisão difícil que você tomou no seu trabalho.",
    formatAdaptation: "Explique isso pra alguém que não conhece o assunto."
  }
});

describe("practice profile generator — G3 calibration anchor", () => {
  it("assembles the 4 fixed acts, in order, anchored in the generated prompts", async () => {
    const { adapter, calls } = scriptedAdapter([ELICITING_ANCHORS_PAYLOAD]);
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

    const parsed = JSON.parse(ELICITING_ANCHORS_PAYLOAD) as {
      anchors: Record<"microOpinion" | "reasoningReflection" | "argumentDevelopment" | "formatAdaptation", string>;
    };
    expect(anchors[0].prompt).toBe(parsed.anchors.microOpinion);
    expect(anchors[1].prompt).toBe(parsed.anchors.reasoningReflection);
    expect(anchors[2].prompt).toBe(parsed.anchors.argumentDevelopment);
    expect(anchors[3].prompt).toBe(parsed.anchors.formatAdaptation);
  });

  // Core regression guard: a calibration question ELICITS the author's specific — the concrete case
  // belongs in their answer — so a question naming no proper noun/number is correct and must pass on the
  // first attempt. The old namesSpecific gate rejected exactly these, and its retry ("add a NAMED
  // specific") is what manufactured "why is rewriting in Rust a fallacy?".
  it("accepts an eliciting question that names no proper noun, on the first attempt", async () => {
    const { adapter, calls } = scriptedAdapter([ELICITING_ANCHORS_PAYLOAD]);
    const anchors = await Effect.runPromise(
      generateCalibrationAnchors({ profile: PROFILE, locale: "pt-BR", deps: depsFor(adapter) })
    );

    expect(calls()).toBe(1);
    const parsed = JSON.parse(ELICITING_ANCHORS_PAYLOAD) as { anchors: { microOpinion: string } };
    expect(anchors[0].prompt).toBe(parsed.anchors.microOpinion);
  });

  // The prompt must forbid presupposing knowledge the author may not have (a named company/technology/
  // case) and steer the specific to the author's answer, so the question stays answerable off the head.
  it("instructs the model to elicit the author's specific, not presuppose a named case", async () => {
    const { adapter, prompts } = scriptedAdapter([ELICITING_ANCHORS_PAYLOAD]);
    await Effect.runPromise(generateCalibrationAnchors({ profile: PROFILE, locale: "pt-BR", deps: depsFor(adapter) }));

    const combined = `${prompts()[0].system}\n${prompts()[0].user}`;
    expect(combined).toMatch(/ELICITS the author's own specific/i);
    expect(combined).toMatch(/never reference a company/i);
    expect(combined).toMatch(/off the top of their head/i);
    // The named specific is steered to the answer, never named in the question.
    expect(combined).toMatch(/belongs in the author's ANSWER/i);
  });

  // Regression guard: the label "Opinião curta"/"Quick take" promises a short, objective question, but
  // the '~N words' targets describe the AUTHOR'S reply, not the question. The prompt must say so and cap
  // each question to one sentence — otherwise the ~60-word answer target leaks into the question length
  // and act 1 balloons into a two-part debate.
  it("instructs the model to keep each question a single short question, not size it to the answer target", async () => {
    const { adapter, prompts } = scriptedAdapter([ELICITING_ANCHORS_PAYLOAD]);
    await Effect.runPromise(generateCalibrationAnchors({ profile: PROFILE, locale: "pt-BR", deps: depsFor(adapter) }));

    const sent = prompts()[0];
    const combined = `${sent.system}\n${sent.user}`;
    // The word count is disclaimed as the reply length, never the question length.
    expect(combined).toMatch(/REPLY/i);
    expect(combined).toMatch(/NEVER the length of the question/i);
    // One question, one sentence — no stacked/multi-part asks.
    expect(combined).toMatch(/ONE sentence/i);
    expect(combined).toMatch(/No stacked or multi-part questions/i);
    // Act 1 anchors in the cliché only; resistance stays implicit (no compound debate question).
    expect(combined).toMatch(/Keep resistance implicit/i);
  });

  // Post-fix the retry no longer fires on a missing proper noun (that manufactured the presupposition) —
  // only a dead filler phrase ("agregar valor") does: retry once, then ship the clean rewrite.
  it("retries once against the cliché suffix when the batch carries a dead filler phrase", async () => {
    const { adapter, calls } = scriptedAdapter([FILLER_ANCHORS_PAYLOAD, ELICITING_ANCHORS_PAYLOAD]);
    const anchors = await Effect.runPromise(
      generateCalibrationAnchors({ profile: PROFILE, locale: "pt-BR", deps: depsFor(adapter) })
    );

    expect(calls()).toBe(2);
    const parsed = JSON.parse(ELICITING_ANCHORS_PAYLOAD) as { anchors: { microOpinion: string } };
    expect(anchors[0].prompt).toBe(parsed.anchors.microOpinion);
  });

  // The filler gate is per anchor: one filler phrase among four clean questions still triggers the retry.
  it("retries when a single anchor carries a filler phrase (partial genericity)", async () => {
    const eliciting = JSON.parse(ELICITING_ANCHORS_PAYLOAD) as { anchors: Record<string, string> };
    const partiallyFiller = JSON.stringify({
      anchors: { ...eliciting.anchors, formatAdaptation: "Explique isso pensando em agregar valor pra quem não conhece." }
    });
    const { adapter, calls } = scriptedAdapter([partiallyFiller, ELICITING_ANCHORS_PAYLOAD]);
    const anchors = await Effect.runPromise(
      generateCalibrationAnchors({ profile: PROFILE, locale: "pt-BR", deps: depsFor(adapter) })
    );

    expect(calls()).toBe(2);
    expect(anchors[3].prompt).toBe(eliciting.anchors.formatAdaptation);
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
