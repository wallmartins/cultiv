import { describe, expect, it } from "vitest";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import {
  deriveMetaphorSignature,
  formatMetaphorStylePromptBlock
} from "../../apps/backend/src/product/voice/metaphor-signature.js";
import { buildStructuredPrompt, createVoiceProfile, criticizeText } from "@my-ai-orchestrator/text-quality";

const wizardExamples: VoiceExampleRecord[] = [
  {
    id: "ex-1",
    userId: "user-1",
    text: "Trabalhar remoto é como pilotar um barco: você precisa ajustar a rota o tempo todo.",
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
    text: "Imagina que aprender algo novo é como abrir uma porta que estava emperrada.",
    language: "pt-BR",
    state: "active",
    classificationLabels: ["reasoning_reflection", "wizard_calibration"],
    antiPatternsExplicit: [],
    pinned: false,
    pendingProfileImpact: false,
    effectiveContentTypeHints: [],
    topicTag: "aprendizado",
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z"
  },
  {
    id: "ex-3",
    userId: "user-1",
    text: "Defendo que ferramentas de IA devem entrar no fluxo, mas testo cada caso antes de recomendar.",
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

describe("metaphor signature", () => {
  it("derives density, mode, and avoid domains from wizard examples", () => {
    const signature = deriveMetaphorSignature(wizardExamples, "occasional");

    expect(signature).toEqual({
      analogyDensity: "common",
      analogyMode: "mixed",
      avoidLiteralDomains: expect.arrayContaining(["trabalho", "remoto", "aprendizado", "barco", "porta"])
    });
  });

  it("boosts density when usesAnalogies trait is stronger than markers", () => {
    const signature = deriveMetaphorSignature(wizardExamples, "common");

    expect(signature?.analogyDensity).toBe("common");
  });

  it("formats a metaphor style prompt block for generation", () => {
    const signature = deriveMetaphorSignature(wizardExamples)!;
    const block = formatMetaphorStylePromptBlock(signature, "carreira");

    expect(block).toContain("== METAPHOR STYLE ==");
    expect(block).toContain("Current topic: carreira");
    expect(block).toContain("Do NOT reuse calibration domains literally");
    expect(block).toContain("not calibration example subjects");
  });

  it("injects METAPHOR STYLE into structured prompt when signature is present", () => {
    const signature = deriveMetaphorSignature(wizardExamples)!;
    const profile = createVoiceProfile("user-1", {
      tone: "informal",
      cadence: "direct",
      metaphorSignature: signature
    });

    const { system } = buildStructuredPrompt(profile);

    expect(system).toContain("== METAPHOR STYLE ==");
    expect(system).toContain("Analogy density:");
  });

  it("flags repeated metaphor lemmas and calibration domain leaks", () => {
    const signature = deriveMetaphorSignature(wizardExamples)!;
    const profile = createVoiceProfile("user-1", { metaphorSignature: signature });
    const result = criticizeText(
      "Carreira é como um barco e, de novo, carreira parece um barco no trabalho remoto.",
      profile
    );

    expect(result.findings.some((finding) => finding.type === "metaphor_repetition")).toBe(true);
    expect(result.findings.some((finding) => finding.type === "metaphor_domain_leak")).toBe(true);
  });
});
