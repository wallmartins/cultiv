import { describe, expect, it } from "vitest";
import { applyTraitConfidencePass, capTraitConfidenceForImmature } from "../../apps/backend/src/product/voice/trait-confidence-pass.js";
import { TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE } from "../../apps/backend/src/product/voice/argument-development-extraction.js";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";

function createExample(id: string, index: number): VoiceExampleRecord {
  return {
    id,
    userId: "user_test",
    text: `Example ${index} text with enough content for trait extraction testing.`,
    language: "pt-BR",
    state: "active",
    classificationLabels: [],
    antiPatternsExplicit: [],
    pinned: false,
    pendingProfileImpact: false,
    effectiveContentTypeHints: ["linkedin-post"],
    evaluation: {
      systemWeight: 1,
      attentionLevel: "medium",
      attentionReasonCodes: [],
      contributionCode: "reinforces_informal_tone",
      contributionPreview: "Preview",
      userPinned: false
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    version: 1
  };
}

describe("trait confidence pass", () => {
  it("marks unknown traits without invented values", () => {
    const result = applyTraitConfidencePass({
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      traits: { openingMode: "observation" },
      traitEvidence: { openingMode: [{ exampleIndex: 1, value: "observation" }] },
      activeExamples: [createExample("ex-1", 1)]
    });

    expect(result?.profile.records.selfQuestioning?.status).toBe("unknown");
    expect(result?.profile.records.selfQuestioning?.value).toBeUndefined();
  });

  it("caps confidence at medium when development is immature", () => {
    const result = applyTraitConfidencePass({
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      traits: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.traits,
      traitEvidence: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.traitEvidence,
      activeExamples: [createExample("ex-1", 1), createExample("ex-2", 2)]
    });

    const capped = capTraitConfidenceForImmature(result!.profile, 2);
    expect(Object.values(capped.records).some((record) => record.confidence === "high")).toBe(false);
  });

  it("detects contradictions as disputed", () => {
    const result = applyTraitConfidencePass({
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      traits: { closingMode: "open_question" },
      traitEvidence: {
        closingMode: [
          { exampleIndex: 1, value: "open_question" },
          { exampleIndex: 2, value: "conclusion" }
        ]
      },
      activeExamples: [createExample("ex-1", 1), createExample("ex-2", 2)]
    });

    expect(result?.profile.records.closingMode?.status).toBe("disputed");
  });

  it("assigns high confidence with three supporting examples", () => {
    const result = applyTraitConfidencePass({
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      traits: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.traits,
      traitEvidence: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.traitEvidence,
      activeExamples: [createExample("ex-1", 1), createExample("ex-2", 2), createExample("ex-3", 3)]
    });

    expect(result?.profile.records.insightTiming?.confidence).toBe("high");
    expect(result?.countsByConfidence.high).toBeGreaterThanOrEqual(1);
  });
});
