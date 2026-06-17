import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { toVoiceProfileDomain, toVoiceProfileRecord } from "@my-ai-orchestrator/database";
import { TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE } from "../../apps/backend/src/product/voice/argument-development-extraction.js";
import { applyTraitConfidencePass } from "../../apps/backend/src/product/voice/trait-confidence-pass.js";
import { deriveVoiceRebuildState } from "../../apps/backend/src/product/voice/voice-rebuild-derivation.js";

describe("development trait profile persistence", () => {
  it("round-trips traitProfile through profile record conversion", () => {
    const traitProfile = applyTraitConfidencePass({
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      traits: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.traits,
      traitEvidence: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.traitEvidence,
      activeExamples: [
        { id: "ex-1", userId: "user_1", state: "active", text: "a", language: "pt-BR" } as never,
        { id: "ex-2", userId: "user_1", state: "active", text: "b", language: "pt-BR" } as never,
        { id: "ex-3", userId: "user_1", state: "active", text: "c", language: "pt-BR" } as never
      ]
    })!.profile;

    const derived = deriveVoiceRebuildState({
      userId: "user_1",
      version: 2,
      timestamp: "2026-06-17T00:00:00.000Z",
      allExamples: [],
      development: {
        ...TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
        traitProfile
      }
    });

    const record = toVoiceProfileRecord(derived.profile);
    const restored = toVoiceProfileDomain(record);

    expect(restored.argumentDevelopmentSignature?.traitProfile).toEqual(traitProfile);
  });
});
