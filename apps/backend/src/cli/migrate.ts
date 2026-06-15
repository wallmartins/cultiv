import { Effect } from "effect";
import { Kysely, PostgresDialect } from "kysely";
import { bootstrapBackendConfig } from "../config/config.js";
import { acquirePostgresPool, releasePostgresPool } from "../infra/postgres-bootstrap.js";
import { runMigrations, expectedDatabaseTables, validateSchema } from "../infra/migration-runner.js";
import type { DatabaseTables } from "../infra/postgres-tables.js";

async function main() {
  const config = bootstrapBackendConfig();

  if (!config.databaseUrl) {
    console.error("DATABASE_URL is required to run migrations");
    process.exit(1);
  }

  const pool = await Effect.runPromise(acquirePostgresPool(config.databaseUrl));

  try {
    const result = await Effect.runPromise(runMigrations(pool));
    console.info("Migrations completed:", result.executedMigrations);

    const dialect = new PostgresDialect({ pool });
    const db = new Kysely<DatabaseTables>({ dialect });

    await Effect.runPromise(validateSchema(db, expectedDatabaseTables));
    console.info("Schema validation passed");
  } catch (error) {
    console.error("Migration or validation failed:", error);
    process.exit(1);
  } finally {
    await Effect.runPromise(releasePostgresPool(pool));
  }
}

main();
