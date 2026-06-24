import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { VoicePinnedLimitExceededError } from "@my-ai-orchestrator/domain";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import { buildVoiceProfileSnapshotId } from "../../apps/backend/src/product/voice/voice-resolution-helpers.js";

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

describe("backend voice service", () => {
  it("creates and lists enriched voice examples", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_1"));

    const created = Effect.runSync(
      services.voice.createExample("user_1", {
        text: "Eu escrevo em primeira pessoa, com frases curtas e diretas para o LinkedIn.",
        language: "pt-BR",
        channel: "linkedin",
        explicitContentType: "linkedin-post",
        pinned: true
      })
    );

    expect(created.pinned).toBe(true);
    expect(created.pendingProfileImpact).toBe(true);
    expect(created.targetProfileVersion).toBe(1);
    expect(created.evaluation.contributionCode).toBe("useful_for_linkedin");

    const page = Effect.runSync(services.voice.listExamples("user_1"));
    expect(page.total).toBe(1);
    expect(page.items[0]?.exampleId).toBe(created.exampleId);
    expect(page.items[0]?.previewText.length).toBeGreaterThan(0);
  });

  it("updates voice examples and supports logical exclusion", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_1"));

    const created = Effect.runSync(
      services.voice.createExample("user_1", {
        text: "Texto base para ser atualizado com mais contexto e clareza depois.",
        language: "pt-BR"
      })
    );

    const updated = Effect.runSync(
      services.voice.updateExample("user_1", created.exampleId, {
        text: "Texto base atualizado com mais contexto, clareza e intenção editorial.",
        state: "excluded"
      })
    );

    expect(updated?.state).toBe("excluded");
    expect(updated?.pendingProfileImpact).toBe(true);
    expect(updated?.evaluation.attentionLevel).toBe("high");

    const excludedPage = Effect.runSync(
      services.voice.listExamples("user_1", {
        state: "excluded"
      })
    );
    expect(excludedPage.total).toBe(1);
  });

  it("returns the consolidated screen when profile and diagnostics exist", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_1"));

    Effect.runSync(
      services.database.voiceProfiles.put({
        id: "voice-profile:user_1",
        userId: "user_1",
        version: 2,
        snapshotId: "snapshot_2",
        confidence: "medium",
        adaptationMode: "standard",
        primaryLanguage: "pt-BR",
        tone: "informal",
        cadence: "direct",
        lexicon: ["produto"],
        constraints: ["preserve user voice"],
        styleMarkers: ["primeira pessoa"],
        rules: ["prefer direct openings"],
        antiPatterns: ["o problema"],
        createdAt: "2026-05-14T00:00:00.000Z",
        updatedAt: "2026-05-14T00:00:00.000Z"
      })
    );

    Effect.runSync(
      services.database.voiceProfileDiagnostics.put({
        id: "voice-diagnostics:user_1",
        userId: "user_1",
        activeVersion: 2,
        updating: false,
        reasonCodes: [],
        nextActionCodes: [],
        bestCoveredContentTypes: [],
        underrepresentedContentTypes: [],
        pendingRebuild: {
          status: "idle",
          nextActionCodes: []
        },
        materialBase: {
          totalExamples: 2,
          activeExamples: 2,
          excludedExamples: 0,
          pinnedExamples: 1,
          byClassification: { positive: 2 },
          byContentType: { "linkedin-post": 1, newsletter: 1 },
          byLanguage: { "pt-BR": 2 }
        },
        createdAt: "2026-05-14T00:00:00.000Z",
        updatedAt: "2026-05-14T00:00:00.000Z"
      })
    );

    const screen = Effect.runSync(services.voice.getProfileScreen("user_1"));

    expect(screen?.profile.version).toBe(2);
    expect(screen?.profile.snapshotId).toBe("snapshot_2");
    expect(screen?.diagnostics.activeVersion).toBe(2);
    expect(screen?.materialBase.totalExamples).toBe(2);
  });

  it("resolves an effective voice profile for the requested content type", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_1"));

    Effect.runSync(
      services.database.voiceProfiles.put({
        id: "voice-profile:user_1",
        userId: "user_1",
        version: 3,
        snapshotId: "snapshot_3",
        confidence: "low",
        adaptationMode: "conservative",
        primaryLanguage: "pt-BR",
        tone: "professional",
        cadence: "balanced",
        lexicon: ["produto", "cliente"],
        constraints: ["preserve user voice"],
        styleMarkers: ["short paragraphs"],
        rules: ["prefer direct openings"],
        antiPatterns: ["the problem"],
        createdAt: "2026-05-14T00:00:00.000Z",
        updatedAt: "2026-05-14T00:00:00.000Z"
      })
    );

    Effect.runSync(
      services.database.voiceProfileDiagnostics.put({
        id: "voice-diagnostics:user_1",
        userId: "user_1",
        activeVersion: 3,
        pendingVersion: 4,
        updating: false,
        reasonCodes: ["insufficient_examples"],
        nextActionCodes: ["add_more_examples"],
        bestCoveredContentTypes: [],
        underrepresentedContentTypes: [],
        pendingRebuild: {
          status: "idle",
          nextActionCodes: []
        },
        materialBase: {
          totalExamples: 2,
          activeExamples: 2,
          excludedExamples: 0,
          pinnedExamples: 1,
          byClassification: { positive: 2 },
          byContentType: { "linkedin-post": 1, newsletter: 1 },
          byLanguage: { "pt-BR": 2 }
        },
        createdAt: "2026-05-14T00:00:00.000Z",
        updatedAt: "2026-05-14T00:00:00.000Z"
      })
    );

    Effect.runSync(
      services.voice.createExample("user_1", {
        text: "Eu abro textos com observações concretas e parágrafos curtos para LinkedIn.",
        language: "pt-BR",
        channel: "linkedin",
        explicitContentType: "linkedin-post",
        pinned: true
      })
    );

    Effect.runSync(
      services.voice.createExample("user_1", {
        text: "Esse formato funciona melhor quando mantenho a narrativa mais medida.",
        language: "pt-BR",
        channel: "newsletter",
        explicitContentType: "newsletter"
      })
    );

    const effective = Effect.runSync(
      services.voice.resolveEffectiveVoice("user_1", {
        contentType: "linkedin-post",
        requestedLanguage: "en-US"
      })
    );

    expect(effective?.metadata.voiceAdaptationMode).toBe("conservative");
    expect(effective?.metadata.voiceProfileConfidence).toBe("low");
    expect(effective?.metadata.voiceProfileSnapshotId).toBe(
      buildVoiceProfileSnapshotId(
        "user_1",
        effective!.metadata.voiceProfileVersionUsed,
        "linkedin-post",
        new Date("2026-05-14T00:00:00.000Z")
      )
    );
    expect(effective?.voiceHints.styleMarkers).toContain("first-person narrative");
    expect(effective?.voiceHints.constraints).toContain("prefer_conservative_voice_adaptation");
    expect(effective?.voiceHints.constraints).toContain("preserve_target_language");
    expect(Effect.runSync(services.database.voiceProfileSnapshots.listByUser("user_1"))).toHaveLength(1);
  });

  it("enforces pinned limits", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_1"));

    Effect.runSync(
      services.voice.createExample("user_1", {
        text: "Eu escrevo com voz muito marcada e pessoal para posts no LinkedIn.",
        pinned: true,
        explicitContentType: "linkedin-post"
      })
    );

    const secondPinned = Effect.runSync(
      Effect.either(
        services.voice.createExample("user_1", {
          text: "Outro texto igualmente forte, mas ainda em uma base pequena demais para dois pins.",
          pinned: true,
          explicitContentType: "linkedin-post"
        })
      )
    );

    expect(secondPinned._tag).toBe("Left");
    expect(secondPinned.left).toBeInstanceOf(VoicePinnedLimitExceededError);
  });
});
