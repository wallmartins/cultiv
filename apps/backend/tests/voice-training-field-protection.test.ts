import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createDatabase } from "@my-ai-orchestrator/database";
import { BackendVoiceTrainingConsentFailureError } from "../src/http/errors.js";
import type { BackendConfig } from "../src/config/config.js";
import { createProtectedVoiceTrainingDatabaseClient } from "../src/product/voice/protected-voice-training-database.js";
import { createBackendProductServices } from "../src/product/core/services.js";
import { createBackendVoiceFieldProtectionService } from "../src/safety/voice-field-protection.js";
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

describe("Voice training field protection and protected persistence", () => {
  it("stores protected voice-example fields while keeping authorized reads functional", () => {
    const rawDatabase = createDatabase();
    const services = Effect.runSync(
      createBackendProductServices(config, {
        database: rawDatabase,
        now: () => new Date("2026-06-02T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_protected_example"));

    const created = Effect.runSync(
      createVoiceExampleInDatabase(services.database, "user_protected_example", {
        text: "Eu escrevo com precisão, contexto e transições curtas.",
        context: "Notas privadas sobre preferência de narrativa.",
        language: "pt-BR",
        pinned: true
      })
    );

    const stored = rawDatabase.snapshot().voiceExamples[created.id];
    expect(stored).toBeDefined();
    expect(stored?.text).toMatch(/^voiceprot:v1:/);
    expect(stored?.text).not.toContain("Eu escrevo com precisão");
    expect(stored?.context).toMatch(/^voiceprot:v1:/);

    const authorized = Effect.runSync(services.database.voiceExamples.listByUser("user_protected_example"));
    expect(authorized[0]?.text).toBe("Eu escrevo com precisão, contexto e transições curtas.");
    expect(authorized[0]?.context).toBe("Notas privadas sobre preferência de narrativa.");
  });

  it("protects committed examples created through the direct ingestion path", () => {
    const rawDatabase = createDatabase();
    const services = Effect.runSync(
      createBackendProductServices(config, {
        database: rawDatabase,
        now: () => new Date("2026-06-02T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_protected_batch"));

    Effect.runSync(
      createVoiceExampleInDatabase(services.database, "user_protected_batch", {
        text: "Exemplo sensível criado diretamente.",
        context: "Contexto sensível do exemplo.",
        language: "pt-BR"
      })
    );

    const committedExamples = Object.values(rawDatabase.snapshot().voiceExamples).filter(
      (record) => record.userId === "user_protected_batch"
    );
    expect(committedExamples).toHaveLength(1);
    expect(committedExamples[0]?.text).toMatch(/^voiceprot:v1:/);
    expect(committedExamples[0]?.text).not.toContain("Exemplo sensível criado diretamente.");
  });

  it("fails closed when protected persistence cannot protect a voice example", () => {
    const rawDatabase = createDatabase();
    const protectedDatabase = createProtectedVoiceTrainingDatabaseClient(rawDatabase, {
      protectVoiceExample: () =>
        Effect.fail(
          new BackendVoiceTrainingConsentFailureError({
            userId: "user_fail_closed",
            reason: "protection_failed",
            message: "Simulated voice field protection failure"
          })
        ),
      unprotectVoiceExample: (record) => Effect.succeed(record),
      protectVoiceExampleBatch: (record) => Effect.succeed(record),
      unprotectVoiceExampleBatch: (record) => Effect.succeed(record)
    });

    const result = Effect.runSync(
      Effect.either(
        protectedDatabase.voiceExamples.create({
          id: "voice-example:user_fail_closed:1",
          userId: "user_fail_closed",
          text: "Texto que nao pode persistir em claro.",
          language: "pt-BR",
          state: "active",
          classificationLabels: ["positive"],
          antiPatternsExplicit: [],
          pinned: false,
          pendingProfileImpact: true,
          effectiveContentTypeHints: [],
          evaluation: {
            systemWeight: 0.5,
            attentionLevel: "medium",
            attentionReasonCodes: [],
            contributionCode: "supports_first_person_voice",
            contributionPreview: "Preview",
            userPinned: false
          },
          createdAt: "2026-06-02T00:00:00.000Z",
          updatedAt: "2026-06-02T00:00:00.000Z"
        })
      )
    );

    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(BackendVoiceTrainingConsentFailureError);
    expect(Object.keys(rawDatabase.snapshot().voiceExamples)).toHaveLength(0);
  });

  it("decrypts voice fields with the previous key during a rotation window", () => {
    const keyA = "a".repeat(32);
    const keyB = "b".repeat(32);
    const protectWithA = createBackendVoiceFieldProtectionService({ keyMaterial: keyA });
    const readDuringRotation = createBackendVoiceFieldProtectionService({
      keyMaterial: keyB,
      previousKeyMaterial: keyA
    });
    const writeWithB = createBackendVoiceFieldProtectionService({ keyMaterial: keyB });

    const baseRecord = {
      id: "voice-example:user_rotation:1",
      userId: "user_rotation",
      text: "Texto protegido para rotacao.",
      context: "Contexto protegido.",
      language: "pt-BR",
      state: "active" as const,
      classificationLabels: ["positive"],
      antiPatternsExplicit: [],
      pinned: false,
      pendingProfileImpact: true,
      effectiveContentTypeHints: [],
      evaluation: {
        systemWeight: 0.5,
        attentionLevel: "medium" as const,
        attentionReasonCodes: [],
        contributionCode: "supports_first_person_voice",
        contributionPreview: "Preview",
        userPinned: false
      },
      createdAt: "2026-06-02T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
      version: 1
    };

    const encrypted = Effect.runSync(protectWithA.protectVoiceExample(baseRecord));
    const decryptedDuringWindow = Effect.runSync(readDuringRotation.unprotectVoiceExample(encrypted));
    expect(decryptedDuringWindow.text).toBe(baseRecord.text);

    const reencrypted = Effect.runSync(writeWithB.protectVoiceExample(decryptedDuringWindow));
    const readAfterRotation = createBackendVoiceFieldProtectionService({ keyMaterial: keyB });
    const decryptedAfterRotation = Effect.runSync(readAfterRotation.unprotectVoiceExample(reencrypted));
    expect(decryptedAfterRotation.text).toBe(baseRecord.text);
    expect(reencrypted.text).not.toBe(encrypted.text);
  });
});
