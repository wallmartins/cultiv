import { Effect } from "effect";
import { Kysely } from "kysely";
import { createDatabase } from "@my-ai-orchestrator/database";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import {
  bootstrapPostgresDatabase,
  type PostgresBootstrapError
} from "./postgres-bootstrap.js";
import { createPostgresDatabaseClient } from "./postgres-client.js";
import {
  expectedDatabaseTables,
  validateSchema,
  type SchemaValidationError
} from "./migration-runner.js";
import type { BackendConfig } from "../config/config.js";
import type { DatabaseTables } from "./postgres-tables.js";

export type BackendDatabaseBootstrapError = PostgresBootstrapError | SchemaValidationError;

export function createBackendDatabaseClient(
  config: BackendConfig
): Effect.Effect<DatabaseClient, BackendDatabaseBootstrapError> {
  return Effect.gen(function* () {
    if (config.databaseUrl) {
      const db = yield* bootstrapPostgresDatabase(config.databaseUrl);

      yield* validateSchema(db, expectedDatabaseTables);

      return createPostgresDatabaseClient(db);
    }

    return createDatabase();
  });
}
