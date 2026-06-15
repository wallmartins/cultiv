import { Effect } from "effect";
import type {
  DatabaseClient,
  DatabaseTransactionInvariantError,
  VoiceExampleBatchRecord,
  VoiceExampleRecord
} from "@my-ai-orchestrator/database";
import type { VoiceExample, VoiceExampleBatch } from "@my-ai-orchestrator/domain";
import type { BackendVoiceFieldProtectionService } from "../../safety/voice-field-protection-types.js";
import type { BackendVoiceTrainingConsentFailureError } from "../../http/errors.js";

export function createProtectedVoiceTrainingDatabaseClient(
  database: DatabaseClient,
  protection: BackendVoiceFieldProtectionService
): DatabaseClient {
  const baseClient = {
    ...database,
    voiceExamples: {
      create: (record: VoiceExample, version?: number) =>
        Effect.gen(function* () {
          const protectedRecord = yield* protection.protectVoiceExample(record);
          const stored = yield* database.voiceExamples.create(protectedRecord, version);
          return yield* protection.unprotectVoiceExample(stored);
        }),
      save: (record: VoiceExampleRecord) =>
        Effect.gen(function* () {
          const protectedRecord = yield* protection.protectVoiceExample(record);
          const stored = yield* database.voiceExamples.save(protectedRecord);
          return yield* protection.unprotectVoiceExample(stored);
        }),
      get: (id: string) =>
        Effect.flatMap(database.voiceExamples.get(id), (record) =>
          record ? protection.unprotectVoiceExample(record) : Effect.succeed(undefined)
        ),
      listByUser: (userId: string) =>
        Effect.flatMap(
          database.voiceExamples.listByUser(userId),
          (records) => Effect.forEach(records, (record) => protection.unprotectVoiceExample(record), { concurrency: 1 })
        ),
      remove: database.voiceExamples.remove,
      removeByUser: database.voiceExamples.removeByUser
    } as unknown as DatabaseClient["voiceExamples"],
    voiceExampleBatches: {
      create: (record: VoiceExampleBatch, version?: number) =>
        Effect.gen(function* () {
          const protectedRecord = yield* protection.protectVoiceExampleBatch(record);
          const stored = yield* database.voiceExampleBatches.create(protectedRecord, version);
          return yield* protection.unprotectVoiceExampleBatch(stored);
        }),
      save: (record: VoiceExampleBatchRecord) =>
        Effect.gen(function* () {
          const protectedRecord = yield* protection.protectVoiceExampleBatch(record);
          const stored = yield* database.voiceExampleBatches.save(protectedRecord);
          return yield* protection.unprotectVoiceExampleBatch(stored);
        }),
      get: (id: string) =>
        Effect.flatMap(database.voiceExampleBatches.get(id), (record) =>
          record ? protection.unprotectVoiceExampleBatch(record) : Effect.succeed(undefined)
        ),
      listByUser: (userId: string) =>
        Effect.flatMap(
          database.voiceExampleBatches.listByUser(userId),
          (records) => Effect.forEach(records, (record) => protection.unprotectVoiceExampleBatch(record), { concurrency: 1 })
        ),
      remove: database.voiceExampleBatches.remove
    } as unknown as DatabaseClient["voiceExampleBatches"],
    transaction: <T, E>(
      operation: (client: DatabaseClient) => Effect.Effect<T, E>
    ): Effect.Effect<T, E | BackendVoiceTrainingConsentFailureError | DatabaseTransactionInvariantError> =>
      database.transaction((transactionClient) =>
        operation(createProtectedVoiceTrainingDatabaseClient(transactionClient, protection))
      ),
    snapshot: database.snapshot
  };

  if ("kysely" in database) {
    return {
      ...baseClient,
      kysely: (database as DatabaseClient & { readonly kysely: unknown }).kysely
    } as unknown as DatabaseClient;
  }

  return baseClient as unknown as DatabaseClient;
}
