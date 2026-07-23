import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import { applyTraitConfidencePass } from "../../apps/backend/src/product/voice/trait-confidence-pass.js";
import { TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE } from "../../apps/backend/src/product/voice/argument-development-extraction.js";
import { buildVoiceHints } from "../../apps/backend/src/product/voice/voice-hints.js";

const config: BackendConfig = {
  environment: "test",
  executionMode: "sync",
  qualityMode: "balanced",
  defaultLanguage: "pt-BR",
  serviceName: "backend",
  host: "127.0.0.1",
  port: 3000,
  version: "0.1.0",
  billingPlanId: "pro",
  billingUserId: "backend"
};

describe("trait confirmation API", () => {
  it("records confirmed trait in diagnostics without changing profile hints", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-06-17T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_trait"));

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

    Effect.runSync(
      services.database.voiceProfiles.put({
        id: "voice-profile:user_trait",
        userId: "user_trait",
        profileVersion: 1,
        snapshotId: "voice-profile-snapshot:user_trait:v1",
        confidence: "medium",
        primaryLanguage: "pt-BR",
        tone: "informal",
        cadence: "direct",
        lexicon: [],
        constraints: [],
        styleMarkers: [],
        rules: [],
        antiPatterns: [],
        argumentDevelopmentSignature: {
          ...TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
          traitProfile
        },
        createdAt: "2026-06-17T00:00:00.000Z",
        updatedAt: "2026-06-17T00:00:00.000Z",
        version: 1
      })
    );

    Effect.runSync(
      services.database.voiceProfileDiagnostics.put({
        id: "voice-diagnostics:user_trait",
        userId: "user_trait",
        activeVersion: 1,
        updating: false,
        reasonCodes: [],
        nextActionCodes: [],
        bestCoveredContentTypes: [],
        underrepresentedContentTypes: [],
        pendingRebuild: { status: "idle", nextActionCodes: [] },
        materialBase: {
          totalExamples: 3,
          activeExamples: 3,
          excludedExamples: 0,
          pinnedExamples: 0,
          byClassification: {},
          byContentType: {},
          byLanguage: {}
        },
        createdAt: "2026-06-17T00:00:00.000Z",
        updatedAt: "2026-06-17T00:00:00.000Z"
      })
    );

    const hintsBefore = buildVoiceHints(
      {
        tone: "informal",
        cadence: "direct",
        lexicon: [],
        constraints: [],
        antiPatterns: [],
        rules: [],
        styleMarkers: [],
        primaryLanguage: "pt-BR",
        argumentDevelopmentSignature: {
          ...TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
          traitProfile
        }
      },
      [],
      [],
      { channel: "professional-network" },
      "medium",
      "standard",
      { reasoningSignatureEnabled: true }
    );

    const diagnostics = Effect.runSync(
      services.voice.recordTraitConfirmation("user_trait", {
        traitKey: "closingMode",
        response: "rejected"
      })
    );

    expect(diagnostics?.traitConfirmations?.closingMode?.response).toBe("rejected");
    expect(diagnostics?.nextActionCodes).toContain("review_conflicting_examples");

    const hintsAfter = buildVoiceHints(
      {
        tone: "informal",
        cadence: "direct",
        lexicon: [],
        constraints: [],
        antiPatterns: [],
        rules: [],
        styleMarkers: [],
        primaryLanguage: "pt-BR",
        argumentDevelopmentSignature: {
          ...TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
          traitProfile
        }
      },
      [],
      [],
      { channel: "professional-network" },
      "medium",
      "standard",
      { reasoningSignatureEnabled: true }
    );

    expect(hintsAfter.argumentDevelopmentSignature).toEqual(hintsBefore.argumentDevelopmentSignature);
  });
});
