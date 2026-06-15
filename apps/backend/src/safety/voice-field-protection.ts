import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Effect } from "effect";
import type {
  VoiceExampleBatchRecord,
  VoiceExampleRecord
} from "@my-ai-orchestrator/database";
import type { VoiceExample, VoiceExampleBatch } from "@my-ai-orchestrator/domain";
import { BackendVoiceTrainingConsentFailureError } from "../http/errors.js";
import type { BackendVoiceFieldProtectionService } from "./voice-field-protection-types.js";

export const protectedVoiceFieldPrefix = "voiceprot:v1:" as const;
const cipherAlgorithm = "aes-256-gcm";
const ivLength = 12;
const authTagLength = 16;

export interface VoiceFieldProtectionKeyOptions {
  readonly keyMaterial: string;
  readonly previousKeyMaterial?: string;
}

export function isProtectedVoiceField(value: string | undefined): boolean {
  return typeof value === "string" && value.startsWith(protectedVoiceFieldPrefix);
}

export function createBackendVoiceFieldProtectionService(
  options: VoiceFieldProtectionKeyOptions
): BackendVoiceFieldProtectionService {
  const key = deriveProtectionKey(options.keyMaterial);
  const previousKey = options.previousKeyMaterial
    ? deriveProtectionKey(options.previousKeyMaterial)
    : undefined;

  return {
    protectVoiceExample: (record) =>
      Effect.gen(function* () {
        const text = yield* protectStringField(record.userId, "voice_example.text", record.text, key);
        const context = yield* protectOptionalStringField(record.userId, "voice_example.context", record.context, key);
        return {
          ...record,
          text,
          context
        };
      }),
    unprotectVoiceExample: (record) =>
      Effect.gen(function* () {
        const text = yield* unprotectStringFieldWithFallback(
          record.userId,
          "voice_example.text",
          record.text,
          key,
          previousKey
        );
        const context = yield* unprotectOptionalStringFieldWithFallback(
          record.userId,
          "voice_example.context",
          record.context,
          key,
          previousKey
        );
        return {
          ...record,
          text,
          context
        };
      }),
    protectVoiceExampleBatch: (record) =>
      Effect.gen(function* () {
        const items = yield* Effect.forEach(record.items, (item) => {
          if (!item.stagedInput) {
            return Effect.succeed(item);
          }

          return Effect.gen(function* () {
            const stagedInput = item.stagedInput!;
            const protectedText = yield* protectStringField(
              record.userId,
              "voice_example_batch.staged_input.text",
              stagedInput.text,
              key
            );
            const protectedContext = yield* protectOptionalStringField(
              record.userId,
              "voice_example_batch.staged_input.context",
              stagedInput.context,
              key
            );
            return {
              ...item,
              stagedInput: {
                ...stagedInput,
                text: protectedText,
                context: protectedContext
              }
            };
          });
        }, { concurrency: 1 });

        return {
          ...record,
          items
        };
      }),
    unprotectVoiceExampleBatch: (record) =>
      Effect.gen(function* () {
        const items = yield* Effect.forEach(record.items, (item) => {
          if (!item.stagedInput) {
            return Effect.succeed(item);
          }

          return Effect.gen(function* () {
            const stagedInput = item.stagedInput!;
            const text = yield* unprotectStringFieldWithFallback(
              record.userId,
              "voice_example_batch.staged_input.text",
              stagedInput.text,
              key,
              previousKey
            );
            const context = yield* unprotectOptionalStringFieldWithFallback(
              record.userId,
              "voice_example_batch.staged_input.context",
              stagedInput.context,
              key,
              previousKey
            );
            return {
              ...item,
              stagedInput: {
                ...stagedInput,
                text,
                context
              }
            };
          });
        }, { concurrency: 1 });

        return {
          ...record,
          items
        };
      })
  };
}

function deriveProtectionKey(keyMaterial: string): Buffer {
  return createHash("sha256").update(keyMaterial).digest();
}

function protectOptionalStringField(
  userId: string,
  fieldName: string,
  value: string | undefined,
  key: Buffer
): Effect.Effect<string | undefined, BackendVoiceTrainingConsentFailureError> {
  if (value === undefined) {
    return Effect.succeed(undefined);
  }

  return protectStringField(userId, fieldName, value, key);
}

function unprotectOptionalStringFieldWithFallback(
  userId: string,
  fieldName: string,
  value: string | undefined,
  key: Buffer,
  previousKey: Buffer | undefined
): Effect.Effect<string | undefined, BackendVoiceTrainingConsentFailureError> {
  if (value === undefined) {
    return Effect.succeed(undefined);
  }

  return unprotectStringFieldWithFallback(userId, fieldName, value, key, previousKey);
}

function protectStringField(
  userId: string,
  fieldName: string,
  value: string,
  key: Buffer
): Effect.Effect<string, BackendVoiceTrainingConsentFailureError> {
  return Effect.try({
    try: () => {
      const iv = randomBytes(ivLength);
      const cipher = createCipheriv(cipherAlgorithm, key, iv);
      const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return `${protectedVoiceFieldPrefix}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
    },
    catch: (cause) =>
      new BackendVoiceTrainingConsentFailureError({
        userId,
        reason: "protection_failed",
        message: `Failed to protect persisted voice field "${fieldName}": ${cause instanceof Error ? cause.message : String(cause)}`
      })
  });
}

function unprotectStringFieldWithFallback(
  userId: string,
  fieldName: string,
  value: string,
  key: Buffer,
  previousKey: Buffer | undefined
): Effect.Effect<string, BackendVoiceTrainingConsentFailureError> {
  if (!isProtectedVoiceField(value)) {
    return Effect.succeed(value);
  }

  return decryptProtectedString(userId, fieldName, value, key).pipe(
    Effect.catchAll((currentError) => {
      if (!previousKey) {
        return Effect.fail(currentError);
      }

      return decryptProtectedString(userId, fieldName, value, previousKey);
    })
  );
}

function decryptProtectedString(
  userId: string,
  fieldName: string,
  value: string,
  key: Buffer
): Effect.Effect<string, BackendVoiceTrainingConsentFailureError> {
  return Effect.try({
    try: () => {
      const payload = value.slice(protectedVoiceFieldPrefix.length);
      const [ivEncoded, authTagEncoded, encryptedEncoded] = payload.split(":");
      if (!ivEncoded || !authTagEncoded || !encryptedEncoded) {
        return failMalformedProtectedPayload();
      }

      const iv = Buffer.from(ivEncoded, "base64");
      const authTag = Buffer.from(authTagEncoded, "base64");
      const encrypted = Buffer.from(encryptedEncoded, "base64");
      if (iv.length !== ivLength || authTag.length !== authTagLength) {
        return failMalformedProtectedPayload();
      }

      const decipher = createDecipheriv(cipherAlgorithm, key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString("utf8");
    },
    catch: (cause) =>
      new BackendVoiceTrainingConsentFailureError({
        userId,
        reason: "protection_failed",
        message: `Failed to unprotect persisted voice field "${fieldName}": ${cause instanceof Error ? cause.message : String(cause)}`
      })
  });
}

function failMalformedProtectedPayload(): never {
  throw new Error("Malformed protected payload");
}
