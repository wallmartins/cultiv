import { describe, expect, it } from "vitest";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import {
  buildVoiceSignatureBrief,
  deriveDevelopmentProseFromBrief,
  deriveReasoningProseFromBrief,
  detectTopicLeakage,
  synthesizeDevelopmentFromBrief,
  synthesizeReasoningExtractionFromBrief
} from "../../apps/backend/src/product/voice/voice-signature-brief.js";
import { resolveReasoningOutputLanguage } from "../../apps/backend/src/product/voice/reasoning-extraction.js";

const wizardExamples: VoiceExampleRecord[] = [
  {
    id: "ex-1",
    userId: "user-1",
    text: "Talvez trabalhar remoto ajude, mas ainda tenho dúvida sobre o que perco em conversa informal.",
    language: "pt-BR",
    state: "active",
    classificationLabels: ["micro_opinion", "wizard_calibration"],
    antiPatternsExplicit: [],
    pinned: false,
    pendingProfileImpact: false,
    effectiveContentTypeHints: [],
    topicTag: "trabalho remoto",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "ex-2",
    userId: "user-1",
    text: "Quando aprendi algo novo no trabalho, primeiro observo o contexto e só depois fecho a conclusão.",
    language: "pt-BR",
    state: "active",
    classificationLabels: ["reasoning_reflection", "wizard_calibration"],
    antiPatternsExplicit: [],
    pinned: false,
    pendingProfileImpact: false,
    effectiveContentTypeHints: [],
    topicTag: "reasoning_reflection",
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z"
  },
  {
    id: "ex-3",
    userId: "user-1",
    text: "Defendo que ferramentas de IA devem entrar no fluxo, mas por outro lado testo cada caso antes de recomendar.",
    language: "pt-BR",
    state: "active",
    classificationLabels: ["argument_development", "wizard_calibration"],
    antiPatternsExplicit: [],
    pinned: false,
    pendingProfileImpact: false,
    effectiveContentTypeHints: [],
    topicTag: "IA no trabalho",
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z"
  }
];

describe("voice signature brief", () => {
  it("builds a brief from wizard examples", () => {
    const brief = buildVoiceSignatureBrief(wizardExamples);

    expect(brief).toBeDefined();
    expect(brief?.stepObservations).toHaveLength(3);
    expect(brief?.suggestedReasoning.certaintyLevel).toBeDefined();
    expect(brief?.aggregate.avgSentenceLength).toBeGreaterThan(0);
  });

  it("produces topic-independent fallback prose", () => {
    const brief = buildVoiceSignatureBrief(wizardExamples)!;
    const outputLanguage = resolveReasoningOutputLanguage(wizardExamples);
    const reasoning = deriveReasoningProseFromBrief(brief, outputLanguage);
    const development = deriveDevelopmentProseFromBrief(brief, outputLanguage);

    expect(reasoning).not.toMatch(/trabalho remoto|ferramentas de ia/i);
    expect(development).not.toMatch(/trabalho remoto|ferramentas de ia/i);
    expect(reasoning.length).toBeGreaterThan(40);
    expect(development.length).toBeGreaterThan(40);
  });

  it("synthesizes full extraction payloads from the brief", () => {
    const brief = buildVoiceSignatureBrief(wizardExamples)!;
    const outputLanguage = resolveReasoningOutputLanguage(wizardExamples);
    const reasoning = synthesizeReasoningExtractionFromBrief(brief, outputLanguage);
    const development = synthesizeDevelopmentFromBrief(brief, outputLanguage);

    expect(reasoning.core.narrativeProse).toContain("dúvida");
    expect(development.developmentProse.length).toBeGreaterThan(0);
    expect(development.moveLabels.length).toBeGreaterThan(0);
  });

  it("flags topic leakage in prose", () => {
    expect(
      detectTopicLeakage(
        "No texto sobre trabalho remoto e ferramentas de IA, o autor defende adoção imediata.",
        wizardExamples
      )
    ).toBe(true);

    expect(
      detectTopicLeakage(
        "O autor observa antes de concluir e deixa a dúvida explícita quando ainda existe.",
        wizardExamples
      )
    ).toBe(false);
  });
});
