import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { toVoiceProfileDomain } from "@my-ai-orchestrator/database";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import { deriveVoiceRebuildState } from "../../apps/backend/src/product/voice/voice-rebuild-derivation.js";
import { TEST_REASONING_EXTRACTION_FIXTURE } from "../../apps/backend/src/product/voice/reasoning-extraction.js";
import type { CoreReasoningSignature } from "@my-ai-orchestrator/contracts";

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
  billingUserId: "backend",
  reasoningSignatureV1Enabled: true
};

const previousCore: CoreReasoningSignature = {
  narrativeProse: "Previous valid reasoning snapshot.",
  certaintyLevel: "low",
  judgmentFrequency: "low",
  conclusionPace: "slow",
  readerRelationship: "observer",
  authoritySource: "lived_experience",
  derivedAntiPatterns: ["generic guru tone"]
};

describe("voice rebuild reasoning", () => {
  it("persists and reloads reasoning fields after rebuild drain", async () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-06-16T12:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_reasoning"));

    Effect.runSync(
      services.voice.createExample("user_reasoning", {
        text: "Eu começo observando o contexto antes de tirar conclusões no LinkedIn.",
        language: "pt-BR",
        explicitContentType: "linkedin-post"
      })
    );

    Effect.runSync(
      services.voice.createExample("user_reasoning", {
        text: "Outro exemplo no mesmo formato, com tom parecido e parágrafos curtos.",
        language: "pt-BR",
        explicitContentType: "linkedin-post"
      })
    );

    Effect.runSync(services.voiceRebuild.schedule("user_reasoning"));
    await Effect.runPromise(services.voiceRebuild.drain("user_reasoning"));

    const stored = Effect.runSync(services.database.voiceProfiles.getByUser("user_reasoning"));
    expect(stored).toBeDefined();

    const profile = toVoiceProfileDomain(stored!);
    expect(profile.coreReasoningSignature?.certaintyLevel).toBe(
      TEST_REASONING_EXTRACTION_FIXTURE.core.certaintyLevel
    );
    expect(profile.formatExpressionProfiles?.["linkedin-post"]).toBeDefined();

    const screen = Effect.runSync(services.voice.getProfileScreen("user_reasoning"));
    expect(screen?.reasoning?.core.certaintyLevel).toBe(TEST_REASONING_EXTRACTION_FIXTURE.core.certaintyLevel);
    expect(screen?.reasoning?.formatExpressions.length).toBeGreaterThan(0);
  });

  it("keeps previous reasoning when extraction result is absent", () => {
    const derived = deriveVoiceRebuildState({
      userId: "user_reasoning",
      version: 3,
      timestamp: "2026-06-16T12:00:00.000Z",
      allExamples: [],
      previousProfile: {
        id: "voice-profile:user_reasoning",
        userId: "user_reasoning",
        version: 2,
        snapshotId: "snapshot-2",
        confidence: "high",
        adaptationMode: "standard",
        primaryLanguage: "pt-BR",
        tone: "informal",
        cadence: "direct",
        lexicon: [],
        constraints: ["preserve_author_voice"],
        styleMarkers: [],
        rules: [],
        antiPatterns: [],
        coreReasoningSignature: previousCore,
        formatExpressionProfiles: {
          "linkedin-post": {
            contentType: "linkedin-post",
            narrativeProse: "Short LinkedIn expression.",
            register: "conversational",
            openingStyle: "direct",
            technicalDensity: "low"
          }
        },
        createdAt: "2026-06-16T11:00:00.000Z",
        updatedAt: "2026-06-16T11:00:00.000Z"
      }
    });

    expect(derived.profile.coreReasoningSignature).toEqual(previousCore);
    expect(derived.profile.formatExpressionProfiles?.["linkedin-post"]?.register).toBe("conversational");
  });

  it("marks diagnostics failed when reasoning extraction fails but keeps previous snapshot", () => {
    const derived = deriveVoiceRebuildState({
      userId: "user_reasoning",
      version: 3,
      timestamp: "2026-06-16T12:00:00.000Z",
      allExamples: [],
      previousProfile: {
        id: "voice-profile:user_reasoning",
        userId: "user_reasoning",
        version: 2,
        snapshotId: "snapshot-2",
        confidence: "high",
        adaptationMode: "standard",
        primaryLanguage: "pt-BR",
        tone: "informal",
        cadence: "direct",
        lexicon: [],
        constraints: ["preserve_author_voice"],
        styleMarkers: [],
        rules: [],
        antiPatterns: [],
        coreReasoningSignature: previousCore,
        createdAt: "2026-06-16T11:00:00.000Z",
        updatedAt: "2026-06-16T11:00:00.000Z"
      },
      reasoningExtractionFailed: true
    });

    expect(derived.profile.coreReasoningSignature).toEqual(previousCore);
    expect(derived.diagnostics.pendingRebuild.status).toBe("failed");
    expect(derived.diagnostics.pendingRebuild.reasonCode).toBe("reasoning_extraction_failed");
    expect(derived.diagnostics.reasonCodes).toContain("reasoning_extraction_failed");
  });
});
