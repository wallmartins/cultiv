import { describe, expect, it } from "vitest";
import { evaluateVoiceSignatureDivergence } from "../../apps/backend/src/product/voice/voice-signature-divergence.js";
import { TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE } from "../../apps/backend/src/product/voice/argument-development-extraction.js";
import { applyTraitConfidencePass } from "../../apps/backend/src/product/voice/trait-confidence-pass.js";
import type { CoreReasoningSignature, ReasoningExtractionResult } from "@my-ai-orchestrator/contracts";

const core: CoreReasoningSignature = {
  narrativeProse: "Fast conclusions from sparse observation.",
  certaintyLevel: "high",
  judgmentFrequency: "high",
  conclusionPace: "fast",
  readerRelationship: "mentor",
  authoritySource: "data",
  derivedAntiPatterns: []
};

const reasoning: ReasoningExtractionResult = {
  core,
  formatExpressions: {}
};

describe("trait-aware voice signature divergence", () => {
  it("flags late insight timing against fast core conclusion pace", () => {
    const traitProfile = applyTraitConfidencePass({
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      traits: { insightTiming: "late" },
      traitEvidence: {
        insightTiming: [
          { exampleIndex: 1, value: "late" },
          { exampleIndex: 2, value: "late" }
        ]
      },
      activeExamples: [
        { id: "ex-1", state: "active" } as never,
        { id: "ex-2", state: "active" } as never
      ]
    })!.profile;

    const divergence = evaluateVoiceSignatureDivergence({
      reasoning,
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      traitProfile
    });

    expect(divergence.reasons).toContain("late_insight_timing_conflicts_with_fast_conclusion_pace");
  });

  it("flags thesis opening with exploratory doubt-heavy moves", () => {
    const traitProfile = applyTraitConfidencePass({
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      traits: { openingMode: "thesis" },
      traitEvidence: { openingMode: [{ exampleIndex: 1, value: "thesis" }] },
      activeExamples: [{ id: "ex-1", state: "active" } as never]
    })!.profile;

    const divergence = evaluateVoiceSignatureDivergence({
      reasoning: {
        core: { ...core, conclusionPace: "slow", certaintyLevel: "moderate" },
        formatExpressions: {}
      },
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      traitProfile
    });

    expect(divergence.reasons).toContain("thesis_opening_conflicts_with_exploratory_doubt_moves");
  });

  it("flags two or more disputed traits", () => {
    const traitProfile = applyTraitConfidencePass({
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      traits: { closingMode: "open_question", openingMode: "thesis" },
      traitEvidence: {
        closingMode: [
          { exampleIndex: 1, value: "open_question" },
          { exampleIndex: 2, value: "conclusion" }
        ],
        openingMode: [
          { exampleIndex: 1, value: "thesis" },
          { exampleIndex: 2, value: "observation" }
        ]
      },
      activeExamples: [
        { id: "ex-1", state: "active" } as never,
        { id: "ex-2", state: "active" } as never
      ]
    })!.profile;

    const divergence = evaluateVoiceSignatureDivergence({
      reasoning: {
        core: { ...core, conclusionPace: "slow", certaintyLevel: "moderate" },
        formatExpressions: {}
      },
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      traitProfile
    });

    expect(divergence.reasons).toContain("multiple_disputed_development_traits");
  });
});
