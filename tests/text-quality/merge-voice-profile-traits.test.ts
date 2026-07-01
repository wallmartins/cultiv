import { describe, expect, it } from "vitest";
import { mergeVoiceProfile } from "@my-ai-orchestrator/text-quality";
import { TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE } from "../../apps/backend/src/product/voice/argument-development-extraction.js";
import { applyTraitConfidencePass } from "../../apps/backend/src/product/voice/trait-confidence-pass.js";

describe("mergeVoiceProfile development traits", () => {
  it("preserves traitProfile on argumentDevelopmentSignature", () => {
    const traitProfile = applyTraitConfidencePass({
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      traits: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.traits,
      traitEvidence: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.traitEvidence,
      activeExamples: [
        { id: "ex-1", state: "active" } as never,
        { id: "ex-2", state: "active" } as never,
        { id: "ex-3", state: "active" } as never
      ]
    })!.profile;

    const development = {
      ...TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      traitProfile
    };

    const merged = mergeVoiceProfile(
      {
        userId: "user_1",
        tone: "informal",
        cadence: "direct",
        lexicon: [],
        constraints: [],
        antiPatterns: [],
        antiPatternsExplicit: [],
        rules: [],
        styleMarkers: [],
        userLabels: [],
        argumentDevelopmentSignature: development
      },
      {}
    );

    expect(merged.argumentDevelopmentSignature?.traitProfile).toEqual(traitProfile);
  });
});
