import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createDatabase } from "@my-ai-orchestrator/database";
import { BackendVoiceTrainingConsentRequiredError } from "../src/http/errors.js";
import { createBackendVoiceConsentService } from "../src/safety/voice-consent.js";
import { createBackendProductServices } from "../src/product/core/services.js";
import type { BackendConfig } from "../src/config/config.js";
import { buildVoiceProfileSnapshotId } from "../src/product/voice/voice-resolution-helpers.js";
import { createVoiceExampleInDatabase } from "./test-helpers.js";

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

describe("Voice training consent-gated ingestion", () => {
  it("allows voice example creation when explicit consent is present", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_1"));

    const created = Effect.runSync(
      createVoiceExampleInDatabase(services.database, "user_1", {
        text: "Eu escrevo em primeira pessoa, com frases curtas e diretas.",
        language: "pt-BR",
        pinned: true
      })
    );

    expect(created.pinned).toBe(true);
    expect(created.pendingProfileImpact).toBe(true);
  });

  it("blocks voice example creation when consent is absent", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    const result = Effect.runSync(
      Effect.either(
        services.voiceCalibration.startSession("user_2")
      )
    );

    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(BackendVoiceTrainingConsentRequiredError);
    expect(result.left).toMatchObject({
      message: expect.stringContaining("consent")
    });
  });

  it("preserves Derived Voice Profile as the generation-time voice source of truth", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_6"));

    Effect.runSync(
      services.database.voiceProfiles.put({
        id: "voice-profile:user_6",
        userId: "user_6",
        version: 1,
        snapshotId: "snapshot_1",
        confidence: "medium",
        primaryLanguage: "pt-BR",
        tone: "professional",
        cadence: "balanced",
        lexicon: ["produto"],
        constraints: ["preserve user voice"],
        styleMarkers: ["short paragraphs"],
        rules: ["prefer direct openings"],
        antiPatterns: ["generic tone"],
        createdAt: "2026-05-14T00:00:00.000Z",
        updatedAt: "2026-05-14T00:00:00.000Z"
      })
    );

    Effect.runSync(
      services.database.voiceProfileDiagnostics.put({
        id: "voice-diagnostics:user_6",
        userId: "user_6",
        activeVersion: 1,
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
          totalExamples: 0,
          activeExamples: 0,
          excludedExamples: 0,
          pinnedExamples: 0,
          byClassification: {},
          byContentType: {},
          byLanguage: {}
        },
        createdAt: "2026-05-14T00:00:00.000Z",
        updatedAt: "2026-05-14T00:00:00.000Z"
      })
    );

    Effect.runSync(
      createVoiceExampleInDatabase(services.database, "user_6", {
        text: "Eu escrevo com clareza e objetividade para o LinkedIn.",
        language: "pt-BR",
        channel: "linkedin",
        explicitContentType: "linkedin-post"
      })
    );

    const effective = Effect.runSync(
      services.voice.resolveEffectiveVoice("user_6", {
        channel: "professional-network"
      })
    );

    expect(effective).toBeDefined();
    expect(effective?.metadata.voiceProfileVersionUsed).toBe(1);
    expect(effective?.voiceHints.tone).toBe("professional");
    expect(effective?.metadata.voiceProfileSnapshotId).toBe(
      buildVoiceProfileSnapshotId(
        "user_6",
        effective!.metadata.voiceProfileVersionUsed,
        "professional-network",
        new Date("2026-05-14T00:00:00.000Z")
      )
    );
  });

  it("fails closed on consent service internal failure", () => {
    const consentService = createBackendVoiceConsentService({
      database: {
        voiceTrainingConsents: {
          getByUser: () => Effect.die(new Error("Simulated repository failure")),
          put: () => Effect.succeed(undefined)
        }
      } as any,
      now: () => new Date()
    });

    const result = Effect.runSync(Effect.either(consentService.assertConsent("user_7")));

    expect(result._tag).toBe("Left");
  });
});

describe("Voice consent revocation and derived voice profile invalidation", () => {
  it("revoking consent removes voice examples, profile, diagnostics, and snapshots", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_revoke_1"));

    Effect.runSync(
      createVoiceExampleInDatabase(services.database, "user_revoke_1", {
        text: "Eu escrevo em primeira pessoa, com frases curtas e diretas.",
        language: "pt-BR",
        pinned: true
      })
    );

    Effect.runSync(services.voice.resolveEffectiveVoice("user_revoke_1", {
      contentType: "linkedin-post"
    }));

    Effect.runSync(services.voiceConsent.revokeConsent("user_revoke_1"));

    const examples = Effect.runSync(services.database.voiceExamples.listByUser("user_revoke_1"));
    const profile = Effect.runSync(services.database.voiceProfiles.getByUser("user_revoke_1"));
    const diagnostics = Effect.runSync(services.database.voiceProfileDiagnostics.getByUser("user_revoke_1"));
    const snapshots = Effect.runSync(services.database.voiceProfileSnapshots.listByUser("user_revoke_1"));

    expect(examples).toHaveLength(0);
    expect(profile).toBeUndefined();
    expect(diagnostics).toBeUndefined();
    expect(snapshots).toHaveLength(0);
  });

  it("returns undefined for effective voice after revocation", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_revoke_2"));

    Effect.runSync(
      services.database.voiceProfiles.put({
        id: "voice-profile:user_revoke_2",
        userId: "user_revoke_2",
        version: 1,
        snapshotId: "snapshot_1",
        confidence: "medium",
        primaryLanguage: "pt-BR",
        tone: "professional",
        cadence: "balanced",
        lexicon: ["produto"],
        constraints: ["preserve user voice"],
        styleMarkers: ["short paragraphs"],
        rules: ["prefer direct openings"],
        antiPatterns: ["generic tone"],
        createdAt: "2026-05-14T00:00:00.000Z",
        updatedAt: "2026-05-14T00:00:00.000Z"
      })
    );

    Effect.runSync(
      services.database.voiceProfileDiagnostics.put({
        id: "voice-diagnostics:user_revoke_2",
        userId: "user_revoke_2",
        activeVersion: 1,
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
          totalExamples: 0,
          activeExamples: 0,
          excludedExamples: 0,
          pinnedExamples: 0,
          byClassification: {},
          byContentType: {},
          byLanguage: {}
        },
        createdAt: "2026-05-14T00:00:00.000Z",
        updatedAt: "2026-05-14T00:00:00.000Z"
      })
    );

    const effectiveBefore = Effect.runSync(
      services.voice.resolveEffectiveVoice("user_revoke_2", {
        channel: "professional-network"
      })
    );
    expect(effectiveBefore).toBeDefined();

    Effect.runSync(services.voiceConsent.revokeConsent("user_revoke_2"));

    const effectiveAfter = Effect.runSync(
      services.voice.resolveEffectiveVoice("user_revoke_2", {
        channel: "professional-network"
      })
    );
    expect(effectiveAfter).toBeUndefined();
  });

  it("blocks voice example creation after revocation", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_revoke_3"));
    Effect.runSync(
      createVoiceExampleInDatabase(services.database, "user_revoke_3", {
        text: "Texto original.",
        language: "pt-BR"
      })
    );
    Effect.runSync(services.voiceConsent.revokeConsent("user_revoke_3"));

    const result = Effect.runSync(
      Effect.either(
        services.voiceCalibration.startSession("user_revoke_3")
      )
    );

    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(BackendVoiceTrainingConsentRequiredError);
  });

  it("allows recovery after fresh consent and re-ingestion", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_revoke_4"));

    Effect.runSync(
      createVoiceExampleInDatabase(services.database, "user_revoke_4", {
        text: "Texto antes da revogação.",
        language: "pt-BR"
      })
    );

    Effect.runSync(services.voiceConsent.revokeConsent("user_revoke_4"));

    const examplesAfterRevoke = Effect.runSync(services.database.voiceExamples.listByUser("user_revoke_4"));
    expect(examplesAfterRevoke).toHaveLength(0);

    Effect.runSync(services.voiceConsent.grantConsent("user_revoke_4"));

    const created = Effect.runSync(
      createVoiceExampleInDatabase(services.database, "user_revoke_4", {
        text: "Texto após novo consentimento.",
        language: "pt-BR",
        pinned: true
      })
    );

    expect(created.pinned).toBe(true);
    expect(created.text).toBe("Texto após novo consentimento.");
  });

  it("blocks successful revocation when voice-example removal fails and keeps reuse blocked", () => {
    const rawDatabase = createDatabase();
    const protectedDatabase = {
      ...rawDatabase,
      voiceExamples: {
        ...rawDatabase.voiceExamples,
        removeByUser: () => Effect.fail(new Error("Simulated example cleanup failure"))
      }
    };
    const services = Effect.runSync(
      createBackendProductServices(config, {
        database: protectedDatabase as typeof rawDatabase,
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_revoke_fail_examples"));
    Effect.runSync(
      createVoiceExampleInDatabase(services.database, "user_revoke_fail_examples", {
        text: "Texto que nao pode sobreviver a revogacao.",
        language: "pt-BR"
      })
    );

    const revokeResult = Effect.runSync(
      Effect.either(services.voiceConsent.revokeConsent("user_revoke_fail_examples"))
    );
    expect(revokeResult._tag).toBe("Left");

    const status = Effect.runSync(
      services.voiceConsent.getConsentStatus("user_revoke_fail_examples")
    );
    expect(status.granted).toBe(false);
    expect(status.revokedAt).toBeUndefined();

    const assertResult = Effect.runSync(
      Effect.either(services.voiceConsent.assertConsent("user_revoke_fail_examples"))
    );
    expect(assertResult._tag).toBe("Left");
    expect(assertResult.left).toBeInstanceOf(BackendVoiceTrainingConsentRequiredError);

    const regrantResult = Effect.runSync(
      Effect.either(services.voiceConsent.grantConsent("user_revoke_fail_examples"))
    );
    expect(regrantResult._tag).toBe("Left");

    const audits = Effect.runSync(services.database.audit.list());
    expect(audits.some((record) => record.mutationType === "voice_training_consent.revocation_blocked")).toBe(true);

    const evidence = Effect.runSync(
      services.policyEvidence.listOperationalEvidence({ boundary: "consent", actorId: "user_revoke_fail_examples" })
    );
    expect(evidence.some((entry) => entry.outcome === "block")).toBe(true);
    expect(evidence.some((entry) => entry.outcome === "revoked")).toBe(false);
  });

  it("blocks successful revocation when derived-profile removal fails", () => {
    const rawDatabase = createDatabase();
    const protectedDatabase = {
      ...rawDatabase,
      voiceProfiles: {
        ...rawDatabase.voiceProfiles,
        removeByUser: () => Effect.fail(new Error("Simulated profile cleanup failure"))
      }
    };
    const services = Effect.runSync(
      createBackendProductServices(config, {
        database: protectedDatabase as typeof rawDatabase,
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_revoke_fail_profile"));

    const result = Effect.runSync(
      Effect.either(services.voiceConsent.revokeConsent("user_revoke_fail_profile"))
    );
    expect(result._tag).toBe("Left");

    const status = Effect.runSync(services.voiceConsent.getConsentStatus("user_revoke_fail_profile"));
    expect(status.granted).toBe(false);
    expect(status.revokedAt).toBeUndefined();
  });

  it("blocks successful revocation when diagnostics removal fails", () => {
    const rawDatabase = createDatabase();
    const protectedDatabase = {
      ...rawDatabase,
      voiceProfileDiagnostics: {
        ...rawDatabase.voiceProfileDiagnostics,
        removeByUser: () => Effect.fail(new Error("Simulated diagnostics cleanup failure"))
      }
    };
    const services = Effect.runSync(
      createBackendProductServices(config, {
        database: protectedDatabase as typeof rawDatabase,
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_revoke_fail_diagnostics"));

    const result = Effect.runSync(
      Effect.either(services.voiceConsent.revokeConsent("user_revoke_fail_diagnostics"))
    );
    expect(result._tag).toBe("Left");

    const status = Effect.runSync(services.voiceConsent.getConsentStatus("user_revoke_fail_diagnostics"));
    expect(status.granted).toBe(false);
    expect(status.revokedAt).toBeUndefined();
  });

  it("blocks successful revocation when snapshot removal fails", () => {
    const rawDatabase = createDatabase();
    const protectedDatabase = {
      ...rawDatabase,
      voiceProfileSnapshots: {
        ...rawDatabase.voiceProfileSnapshots,
        removeByUser: () => Effect.fail(new Error("Simulated snapshot cleanup failure"))
      }
    };
    const services = Effect.runSync(
      createBackendProductServices(config, {
        database: protectedDatabase as typeof rawDatabase,
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_revoke_fail_snapshots"));

    const result = Effect.runSync(
      Effect.either(services.voiceConsent.revokeConsent("user_revoke_fail_snapshots"))
    );
    expect(result._tag).toBe("Left");

    const status = Effect.runSync(services.voiceConsent.getConsentStatus("user_revoke_fail_snapshots"));
    expect(status.granted).toBe(false);
    expect(status.revokedAt).toBeUndefined();
  });
});
