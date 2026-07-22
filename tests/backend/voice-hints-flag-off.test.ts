import { describe, expect, it } from "vitest";
import { buildVoiceHints } from "../../apps/backend/src/product/voice/voice-hints.js";
import type { CoreReasoningSignature } from "@my-ai-orchestrator/contracts";

import { TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE } from "../../apps/backend/src/product/voice/argument-development-extraction.js";

const core: CoreReasoningSignature = {
  narrativeProse: "Observes before concluding.",
  certaintyLevel: "moderate",
  judgmentFrequency: "low",
  conclusionPace: "slow",
  readerRelationship: "peer",
  authoritySource: "personal_observation",
  derivedAntiPatterns: ["generic linkedin tone", "numbered thesis proof list"]
};

describe("buildVoiceHints reasoning flag", () => {
  const profile = {
    tone: "informal",
    cadence: "direct",
    lexicon: [],
    constraints: [],
    antiPatterns: ["surface anti-pattern"],
    rules: [],
    styleMarkers: [],
    primaryLanguage: "pt-BR",
    coreReasoningSignature: core,
    argumentDevelopmentSignature: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development
  };

  it("does not expose reasoning fields or derived anti-patterns when flag is off", () => {
    const hints = buildVoiceHints(profile, [], [], { channel: "professional-network" }, "high", "standard", {
      reasoningSignatureEnabled: false
    });

    expect(hints.coreReasoningSignature).toBeUndefined();
    expect(hints.argumentDevelopmentSignature).toBeUndefined();
    expect(hints.derivedAntiPatterns).toBeUndefined();
    expect(hints.antiPatterns).not.toContain("generic linkedin tone");
    expect(hints.antiPatterns).toContain("surface anti-pattern");
  });

  it("exposes reasoning fields and derived anti-patterns when flag is on", () => {
    const hints = buildVoiceHints(profile, [], [], { channel: "professional-network" }, "high", "standard", {
      reasoningSignatureEnabled: true
    });

    expect(hints.coreReasoningSignature).toEqual(core);
    expect(hints.argumentDevelopmentSignature).toEqual(TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development);
    expect(hints.derivedAntiPatterns).toEqual(core.derivedAntiPatterns);
    expect(hints.antiPatterns).toContain("generic linkedin tone");
  });
});
