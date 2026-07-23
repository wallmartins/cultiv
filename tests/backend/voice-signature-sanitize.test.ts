import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  ArgumentDevelopmentExtractionResultSchema,
  ReasoningExtractionResultSchema
} from "@my-ai-orchestrator/contracts";
import {
  sanitizeDevelopmentRaw,
  sanitizeReasoningRaw
} from "../../apps/backend/src/product/voice/voice-signature-sanitize.js";

const decodeDevelopment = Schema.decodeUnknownSync(ArgumentDevelopmentExtractionResultSchema);
const decodeReasoning = Schema.decodeUnknownSync(ReasoningExtractionResultSchema);

describe("voice signature sanitize", () => {
  it("coerces a hallucinated epistemicPosture so decode succeeds, without touching the prose", () => {
    const raw = {
      development: {
        developmentProse: "O autor abre situando o contexto e fecha por acúmulo de exemplos.",
        moveLabels: ["contexto", "exemplo"],
        transitionTendencies: [{ from: "contexto", to: "exemplo", frequency: "common" }],
        epistemicPosture: "analytical",
        structuralAntiPatterns: []
      }
    };

    const sanitized = sanitizeDevelopmentRaw(raw) as { development: { epistemicPosture: string; developmentProse: string } };
    expect(sanitized.development.epistemicPosture).toBe("not_applicable");
    expect(sanitized.development.developmentProse).toBe(raw.development.developmentProse);
    expect(() => decodeDevelopment(sanitized)).not.toThrow();
  });

  it("coerces an invalid transition frequency and drops invalid optional traits", () => {
    const raw = {
      development: {
        developmentProse: "prosa válida do modelo",
        moveLabels: [],
        transitionTendencies: [{ from: "a", to: "b", frequency: "sometimes" }],
        epistemicPosture: "exploratory",
        structuralAntiPatterns: []
      },
      traits: { openingMode: "not-a-mode" }
    };

    const sanitized = sanitizeDevelopmentRaw(raw) as {
      development: { transitionTendencies: { frequency: string }[] };
      traits?: unknown;
    };
    expect(sanitized.development.transitionTendencies[0]?.frequency).toBe("occasional");
    expect(sanitized.traits).toBeUndefined();
    expect(() => decodeDevelopment(sanitized)).not.toThrow();
  });

  it("coerces hallucinated reasoning enums to safe defaults, preserving narrativeProse", () => {
    const raw = {
      core: {
        narrativeProse: "O autor observa antes de julgar.",
        certaintyLevel: "very-high",
        judgmentFrequency: "moderate",
        conclusionPace: "instant",
        readerRelationship: "friend",
        authoritySource: "vibes"
      }
    };

    const sanitized = sanitizeReasoningRaw(raw) as { core: { narrativeProse: string } };
    expect(sanitized.core.narrativeProse).toBe(raw.core.narrativeProse);
    expect(() => decodeReasoning(sanitized)).not.toThrow();
  });

  it("leaves an already-valid payload structurally intact", () => {
    const raw = {
      core: {
        narrativeProse: "prosa",
        certaintyLevel: "moderate",
        judgmentFrequency: "low",
        conclusionPace: "slow",
        readerRelationship: "peer",
        authoritySource: "personal_observation",
        derivedAntiPatterns: ["x"]
      }
    };

    expect(sanitizeReasoningRaw(raw)).toEqual(raw);
  });
});
