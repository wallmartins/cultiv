import { Effect } from "effect";
import { Kysely, PostgresDialect, sql } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import type { Pool } from "pg";
import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { backendPackageRoot } from "../package-root.js";
import type { DatabaseTables } from "./postgres-tables.js";
import { createPostgresBootstrapError, type PostgresBootstrapError } from "./postgres-bootstrap.js";

const compiledMigrationDir = resolve(backendPackageRoot, "dist/infra/migrations");
const sourceMigrationDir = resolve(backendPackageRoot, "src/infra/migrations");
const migrationFolder = existsSync(compiledMigrationDir) ? compiledMigrationDir : sourceMigrationDir;

export interface MigrationResult {
  readonly executedMigrations: readonly string[];
  readonly error?: string;
}

export interface SchemaValidationError {
  readonly _tag: "SchemaValidationError";
  readonly message: string;
  readonly reason: "connectivity" | "schema_mismatch" | "unsupported_version";
}

export function createSchemaValidationError(
  message: string,
  reason: SchemaValidationError["reason"]
): SchemaValidationError {
  return { _tag: "SchemaValidationError", message, reason };
}

const migrationTableMarkers = {
  "0001-init-schema": ["jobs", "voice_example_batches"],
  "0002-add-application-users-and-operators": ["application_users", "operators"],
  "0003-add-audit-records": ["audit_records"],
  "0004-add-voice-training-consents": ["voice_training_consents"],
  "0005-durable-runtime": ["billing_snapshots", "outbox_events", "execution_idempotency"],
  "0006-billing-relational": ["billing_plans", "billing_subscriptions"],
  "0007-voice-reasoning-fields": ["voice_profiles"],
  "0008-argument-development-signature": ["voice_profiles"],
  "0009-development-trait-profile": ["voice_profiles"],
  "0010-billing-gateway": ["billing_gateway_catalog", "billing_gateway_events"],
  "0011-billing-topup-seed": ["billing_top_up_packages"]
} as const;

export function baselineAppliedMigrations(
  db: Kysely<DatabaseTables>
): Effect.Effect<readonly string[], PostgresBootstrapError> {
  return Effect.gen(function* () {
    const tables = yield* Effect.tryPromise({
      try: async () => {
        const result = await db.introspection.getTables({ withInternalKyselyTables: false });
        return new Set(result.map((table) => table.name));
      },
      catch: (error) => createPostgresBootstrapError("Failed to introspect database for migration baseline", error)
    });

    if (!tables.has("kysely_migration")) {
      yield* Effect.tryPromise({
        try: () =>
          sql`create table if not exists kysely_migration (name varchar(255) primary key, timestamp varchar(255) not null)`.execute(db),
        catch: (error) => createPostgresBootstrapError("Failed to create kysely_migration table", error)
      });
    }

    const applied = yield* Effect.tryPromise({
      try: async () => {
        const result = await sql<{ name: string }>`select name from kysely_migration`.execute(db);
        return new Set(result.rows.map((row) => row.name));
      },
      catch: (error) => createPostgresBootstrapError("Failed to read migration history for baseline", error)
    });

    const baselined: string[] = [];
    const timestamp = new Date().toISOString();

    for (const [migrationName, markerTables] of Object.entries(migrationTableMarkers)) {
      if (applied.has(migrationName)) {
        continue;
      }

      if (!markerTables.every((tableName) => tables.has(tableName))) {
        continue;
      }

      yield* Effect.tryPromise({
        try: () =>
          sql`insert into kysely_migration (name, timestamp) values (${migrationName}, ${timestamp})`.execute(db),
        catch: (error) => createPostgresBootstrapError(`Failed to baseline migration ${migrationName}`, error)
      });

      baselined.push(migrationName);
    }

    return baselined;
  });
}

export function runMigrations(
  pool: Pool
): Effect.Effect<MigrationResult, PostgresBootstrapError> {
  return Effect.gen(function* () {
    const dialect = new PostgresDialect({ pool });
    const db = new Kysely<DatabaseTables>({ dialect });

    const baselined = yield* baselineAppliedMigrations(db);
    if (baselined.length > 0) {
      console.info("Baselined existing schema migrations:", baselined);
    }

    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs: {
          readdir: (path: string) => readdir(path)
        },
        path: {
          join: (a: string, b: string) => pathToFileURL(resolve(a, b)).href
        },
        migrationFolder
      })
    });

    const { error, results } = yield* Effect.tryPromise({
      try: () => migrator.migrateToLatest(),
      catch: (e) =>
        createPostgresBootstrapError("Migration execution failed", e)
    });

    const executedMigrations = results
      ? results
          .filter((r) => r.status === "Success")
          .map((r) => r.migrationName)
      : [];

    if (error) {
      return yield* Effect.fail(
        createPostgresBootstrapError(
          `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
          error
        )
      );
    }

    return {
      executedMigrations: [...baselined, ...executedMigrations]
    };
  });
}

export function validateSchema(
  db: Kysely<DatabaseTables>,
  expectedTables: readonly string[]
): Effect.Effect<void, SchemaValidationError> {
  return Effect.gen(function* () {
    const tables = yield* Effect.tryPromise({
      try: async () => {
        const result = await db.introspection.getTables({
          withInternalKyselyTables: false
        });
        return result.map((t) => t.name);
      },
      catch: (e) =>
        createSchemaValidationError(
          `Failed to introspect database: ${e instanceof Error ? e.message : String(e)}`,
          "connectivity"
        )
    });

    const missing = expectedTables.filter((t) => !tables.includes(t));
    if (missing.length > 0) {
      return yield* Effect.fail(
        createSchemaValidationError(
          `Missing tables: ${missing.join(", ")}`,
          "schema_mismatch"
        )
      );
    }

    return undefined;
  });
}

export const expectedDatabaseTables = [
  "jobs",
  "memories",
  "content_types",
  "pipelines",
  "voice_examples",
  "voice_profiles",
  "voice_profile_diagnostics",
  "voice_profile_snapshots",
  "voice_example_batches",
  "application_users",
  "operators",
  "audit_records",
  "voice_training_consents",
  "billing_snapshots",
  "billing_plans",
  "billing_subscriptions",
  "billing_usage_records",
  "billing_ledger_entries",
  "billing_reservations",
  "billing_cycle_states",
  "billing_top_up_packages",
  "billing_operation_idempotency",
  "outbox_events",
  "execution_idempotency"
] as const;
