import { Cause, Effect, Exit, Option } from "effect";
import { Kysely } from "kysely";
import {
  DatabaseTransactionInvariantError,
  type DatabaseClient,
  type DatabaseSnapshot
} from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "./postgres-tables.js";
import { createPostgresJobRepository } from "./postgres-repositories/postgres-job-repository.js";
import { createPostgresMemoryRepository } from "./postgres-repositories/postgres-memory-repository.js";
import { createPostgresContentTypeRepository } from "./postgres-repositories/postgres-content-type-repository.js";
import { createPostgresPipelineRepository } from "./postgres-repositories/postgres-pipeline-repository.js";
import { createPostgresVoiceExampleRepository } from "./postgres-repositories/postgres-voice-example-repository.js";
import { createPostgresVoiceProfileRepository } from "./postgres-repositories/postgres-voice-profile-repository.js";
import { createPostgresVoiceProfileDiagnosticsRepository } from "./postgres-repositories/postgres-voice-profile-diagnostics-repository.js";
import { createPostgresVoiceProfileSnapshotRepository } from "./postgres-repositories/postgres-voice-profile-snapshot-repository.js";
import { createPostgresVoiceExampleBatchRepository } from "./postgres-repositories/postgres-voice-example-batch-repository.js";
import { createPostgresVoiceTrainingConsentRepository } from "./postgres-repositories/postgres-voice-training-consent-repository.js";
import { createPostgresAuditRepository } from "./postgres-repositories/postgres-audit-repository.js";

export interface PostgresDatabaseClient extends DatabaseClient {
  readonly kysely: Kysely<DatabaseTables>;
}

export function getPostgresDatabase(
  client: DatabaseClient
): Kysely<DatabaseTables> | undefined {
  if ("kysely" in client && client.kysely instanceof Kysely) {
    return client.kysely;
  }

  return undefined;
}

export function createPostgresDatabaseClient(db: Kysely<DatabaseTables>): DatabaseClient {
  return {
    kysely: db,
    jobs: createPostgresJobRepository(db),
    memories: createPostgresMemoryRepository(db),
    contentTypes: createPostgresContentTypeRepository(db),
    pipelines: createPostgresPipelineRepository(db),
    voiceExamples: createPostgresVoiceExampleRepository(db),
    voiceProfiles: createPostgresVoiceProfileRepository(db),
    voiceProfileDiagnostics: createPostgresVoiceProfileDiagnosticsRepository(db),
    voiceProfileSnapshots: createPostgresVoiceProfileSnapshotRepository(db),
    voiceExampleBatches: createPostgresVoiceExampleBatchRepository(db),
    voiceTrainingConsents: createPostgresVoiceTrainingConsentRepository(db),
    audit: createPostgresAuditRepository(db),

    transaction<T, E>(
      operation: (client: DatabaseClient) => Effect.Effect<T, E>
    ): Effect.Effect<T, E | DatabaseTransactionInvariantError> {
      return Effect.async((resume) => {
        void db.transaction().execute(async (trxDb) => {
          const trxClient = createPostgresDatabaseClient(trxDb as unknown as Kysely<DatabaseTables>);
          const exit = await Effect.runPromiseExit(operation(trxClient));
          if (Exit.isSuccess(exit)) {
            return exit.value;
          }

          throw exit;
        }).then(
          (value) => resume(Effect.succeed(value)),
          (error) => {
            if (Exit.isFailure(error)) {
              const failure = Cause.failureOption(error.cause);
              if (Option.isSome(failure)) {
                resume(Effect.fail(failure.value as E));
                return;
              }
            }

            resume(
              Effect.fail(
                new DatabaseTransactionInvariantError({
                  message: error instanceof Error ? error.message : String(error)
                })
              )
            );
          }
        );
      });
    },

    snapshot(): DatabaseSnapshot {
      throw new Error("snapshot() is not supported in PostgreSQL mode");
    }
  } satisfies PostgresDatabaseClient as DatabaseClient;
}
