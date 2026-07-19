import { Effect } from "effect";
import type { Kysely } from "kysely";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../infra/postgres-tables.js";
import { BackendVoiceTrainingConsentFailureError } from "../http/errors.js";
import {
  createBackendVoiceFieldProtectionService,
  isProtectedVoiceField,
  type VoiceFieldProtectionKeyOptions
} from "./voice-field-protection.js";

export interface VoiceFieldProtectionRotationResult {
  readonly dryRun: boolean;
  readonly encryptPlaintext: boolean;
  readonly voiceExamplesScanned: number;
  readonly voiceExamplesRotated: number;
}

export interface VoiceFieldProtectionRotationError {
  readonly _tag: "VoiceFieldProtectionRotationError";
  readonly message: string;
  readonly entityType: "voice_example";
  readonly entityId: string;
  readonly cause?: unknown;
}

export function createVoiceFieldProtectionRotationError(
  message: string,
  entityType: VoiceFieldProtectionRotationError["entityType"],
  entityId: string,
  cause?: unknown
): VoiceFieldProtectionRotationError {
  return { _tag: "VoiceFieldProtectionRotationError", message, entityType, entityId, cause };
}

export function rotateVoiceFieldProtectionInDatabase(args: {
  readonly db: Kysely<DatabaseTables>;
  readonly keys: VoiceFieldProtectionKeyOptions;
  readonly dryRun?: boolean;
  readonly encryptPlaintext?: boolean;
}): Effect.Effect<VoiceFieldProtectionRotationResult, VoiceFieldProtectionRotationError> {
  const dryRun = args.dryRun ?? false;
  const encryptPlaintext = args.encryptPlaintext ?? false;
  const readProtection = createBackendVoiceFieldProtectionService(args.keys);
  const writeProtection = createBackendVoiceFieldProtectionService({
    keyMaterial: args.keys.keyMaterial
  });

  return Effect.gen(function* () {
    let voiceExamplesRotated = 0;

    const exampleRows = yield* Effect.tryPromise({
      try: () => args.db.selectFrom("voice_examples").selectAll().execute(),
      catch: (cause) =>
        createVoiceFieldProtectionRotationError("Failed to list voice examples", "voice_example", "*", cause)
    });

    for (const row of exampleRows) {
      const record = parseVoiceExampleRow(row);
      if (!voiceExampleQualifiesForProtectionRotation(record, encryptPlaintext)) {
        continue;
      }

      const rotated = yield* rotateVoiceExampleRecord(record, readProtection, writeProtection).pipe(
        Effect.mapError((error) =>
          createVoiceFieldProtectionRotationError(
            error.message,
            "voice_example",
            record.id,
            error
          )
        )
      );

      if (!dryRun) {
        yield* persistVoiceExampleRow(args.db, rotated);
      }

      voiceExamplesRotated += 1;
    }

    return {
      dryRun,
      encryptPlaintext,
      voiceExamplesScanned: exampleRows.length,
      voiceExamplesRotated
    };
  });
}

function rotateVoiceExampleRecord(
  record: VoiceExampleRecord,
  readProtection: ReturnType<typeof createBackendVoiceFieldProtectionService>,
  writeProtection: ReturnType<typeof createBackendVoiceFieldProtectionService>
): Effect.Effect<VoiceExampleRecord, BackendVoiceTrainingConsentFailureError> {
  return Effect.gen(function* () {
    const plaintext = yield* readProtection.unprotectVoiceExample(record);
    const reprotected = yield* writeProtection.protectVoiceExample(plaintext);
    return {
      ...reprotected,
      version: record.version + 1
    };
  });
}

export function voiceExampleQualifiesForProtectionRotation(
  record: VoiceExampleRecord,
  encryptPlaintext: boolean
): boolean {
  if (isProtectedVoiceField(record.text) || isProtectedVoiceField(record.context)) {
    return true;
  }

  if (!encryptPlaintext) {
    return false;
  }

  return hasPlaintextVoiceField(record.text) || hasPlaintextVoiceField(record.context);
}

function hasPlaintextVoiceField(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0 && !isProtectedVoiceField(value);
}

function parseVoiceExampleRow(row: {
  readonly id: string;
  readonly user_id: string;
  readonly data: unknown;
  readonly version: number;
  readonly created_at: string;
}): VoiceExampleRecord {
  return {
    ...(typeof row.data === "string" ? JSON.parse(row.data) : (row.data as VoiceExampleRecord)),
    version: row.version,
    createdAt: row.created_at
  };
}

function persistVoiceExampleRow(
  db: Kysely<DatabaseTables>,
  record: VoiceExampleRecord
): Effect.Effect<void, VoiceFieldProtectionRotationError> {
  return Effect.tryPromise({
    try: () =>
      db
        .updateTable("voice_examples")
        .set({
          data: JSON.stringify(record),
          version: record.version
        })
        .where("id", "=", record.id)
        .execute(),
    catch: (cause) => createVoiceFieldProtectionRotationError("Failed to persist rotated voice example", "voice_example", record.id, cause)
  });
}
