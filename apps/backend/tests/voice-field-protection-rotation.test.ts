import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import { createBackendVoiceFieldProtectionService } from "../src/safety/voice-field-protection.js";
import {
  voiceExampleQualifiesForProtectionRotation
} from "../src/safety/voice-field-protection-rotation.js";

const keyMaterial = "c".repeat(32);

describe("voice field protection rotation", () => {
  it("skips plaintext rows unless encryptPlaintext is enabled", () => {
    const record = createVoiceExampleRecord({
      text: "Legado em texto claro.",
      context: "Contexto legado."
    });

    expect(voiceExampleQualifiesForProtectionRotation(record, false)).toBe(false);
    expect(voiceExampleQualifiesForProtectionRotation(record, true)).toBe(true);
  });

  it("always includes already protected rows", () => {
    const protection = createBackendVoiceFieldProtectionService({ keyMaterial });
    const protectedRecord = Effect.runSync(
      protection.protectVoiceExample(
        createVoiceExampleRecord({
          text: "Ja protegido.",
          context: "Contexto protegido."
        })
      )
    );

    expect(voiceExampleQualifiesForProtectionRotation(protectedRecord, false)).toBe(true);
    expect(voiceExampleQualifiesForProtectionRotation(protectedRecord, true)).toBe(true);
  });

  it("encrypts legacy plaintext voice examples through the rotation write path", () => {
    const readProtection = createBackendVoiceFieldProtectionService({ keyMaterial });
    const writeProtection = createBackendVoiceFieldProtectionService({ keyMaterial });
    const legacy = createVoiceExampleRecord({
      text: "Exemplo legado sem criptografia.",
      context: "Contexto legado."
    });

    const encrypted = Effect.runSync(
      Effect.gen(function* () {
        const plaintext = yield* readProtection.unprotectVoiceExample(legacy);
        return yield* writeProtection.protectVoiceExample(plaintext);
      })
    );

    expect(encrypted.text).toMatch(/^voiceprot:v1:/);
    expect(encrypted.context).toMatch(/^voiceprot:v1:/);
    expect(encrypted.text).not.toContain("Exemplo legado");
  });
});

function createVoiceExampleRecord(
  overrides: Pick<VoiceExampleRecord, "text" | "context">
): VoiceExampleRecord {
  return {
    id: "voice-example:user_legacy:1",
    userId: "user_legacy",
    text: overrides.text,
    context: overrides.context,
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
    updatedAt: "2026-06-02T00:00:00.000Z",
    version: 1
  };
}
