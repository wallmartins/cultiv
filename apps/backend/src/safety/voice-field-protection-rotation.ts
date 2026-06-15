import { Effect } from "effect";
import type { Kysely } from "kysely";
import type { VoiceExampleBatchRecord, VoiceExampleRecord } from "@my-ai-orchestrator/database";
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
  readonly voiceExampleBatchesScanned: number;
  readonly voiceExampleBatchesRotated: number;
}

export interface VoiceFieldProtectionRotationError {
  readonly _tag: "VoiceFieldProtectionRotationError";
  readonly message: string;
  readonly entityType: "voice_example" | "voice_example_batch";
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
    let voiceExampleBatchesRotated = 0;

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

    const batchRows = yield* Effect.tryPromise({
      try: () => args.db.selectFrom("voice_example_batches").selectAll().execute(),
      catch: (cause) =>
        createVoiceFieldProtectionRotationError("Failed to list voice example batches", "voice_example_batch", "*", cause)
    });

    for (const row of batchRows) {
      const record = parseVoiceExampleBatchRow(row);
      if (!voiceExampleBatchQualifiesForProtectionRotation(record, encryptPlaintext)) {
        continue;
      }

      const rotated = yield* rotateVoiceExampleBatchRecord(record, readProtection, writeProtection).pipe(
        Effect.mapError((error) =>
          createVoiceFieldProtectionRotationError(
            error.message,
            "voice_example_batch",
            record.id,
            error
          )
        )
      );

      if (!dryRun) {
        yield* persistVoiceExampleBatchRow(args.db, rotated);
      }

      voiceExampleBatchesRotated += 1;
    }

    return {
      dryRun,
      encryptPlaintext,
      voiceExamplesScanned: exampleRows.length,
      voiceExamplesRotated,
      voiceExampleBatchesScanned: batchRows.length,
      voiceExampleBatchesRotated
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

function rotateVoiceExampleBatchRecord(
  record: VoiceExampleBatchRecord,
  readProtection: ReturnType<typeof createBackendVoiceFieldProtectionService>,
  writeProtection: ReturnType<typeof createBackendVoiceFieldProtectionService>
): Effect.Effect<VoiceExampleBatchRecord, BackendVoiceTrainingConsentFailureError> {
  return Effect.gen(function* () {
    const plaintext = yield* readProtection.unprotectVoiceExampleBatch(record);
    const reprotected = yield* writeProtection.protectVoiceExampleBatch(plaintext);
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

export function voiceExampleBatchQualifiesForProtectionRotation(
  record: VoiceExampleBatchRecord,
  encryptPlaintext: boolean
): boolean {
  return record.items.some((item) =>
    voiceExampleBatchItemQualifiesForProtectionRotation(item.stagedInput, encryptPlaintext)
  );
}

function voiceExampleBatchItemQualifiesForProtectionRotation(
  stagedInput: VoiceExampleBatchRecord["items"][number]["stagedInput"],
  encryptPlaintext: boolean
): boolean {
  if (!stagedInput) {
    return false;
  }

  if (isProtectedVoiceField(stagedInput.text) || isProtectedVoiceField(stagedInput.context)) {
    return true;
  }

  if (!encryptPlaintext) {
    return false;
  }

  return hasPlaintextVoiceField(stagedInput.text) || hasPlaintextVoiceField(stagedInput.context);
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

function parseVoiceExampleBatchRow(row: {
  readonly id: string;
  readonly user_id: string;
  readonly data: unknown;
  readonly version: number;
  readonly created_at: string;
  readonly updated_at: string;
}): VoiceExampleBatchRecord {
  return {
    ...(typeof row.data === "string" ? JSON.parse(row.data) : (row.data as VoiceExampleBatchRecord)),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
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

function persistVoiceExampleBatchRow(
  db: Kysely<DatabaseTables>,
  record: VoiceExampleBatchRecord
): Effect.Effect<void, VoiceFieldProtectionRotationError> {
  return Effect.tryPromise({
    try: () =>
      db
        .updateTable("voice_example_batches")
        .set({
          data: JSON.stringify(record),
          version: record.version,
          updated_at: record.updatedAt
        })
        .where("id", "=", record.id)
        .execute(),
    catch: (cause) =>
      createVoiceFieldProtectionRotationError("Failed to persist rotated voice example batch", "voice_example_batch", record.id, cause)
  });
}
