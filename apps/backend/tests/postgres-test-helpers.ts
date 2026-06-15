import { Effect } from "effect";
import { Kysely, PostgresDialect, sql } from "kysely";
import type { Pool } from "pg";
import { acquirePostgresPool, releasePostgresPool } from "../src/infra/postgres-bootstrap.js";
import type { DatabaseTables } from "../src/infra/postgres-tables.js";
import { up as migrate0001 } from "../src/infra/migrations/0001-init-schema.js";
import { up as migrate0002 } from "../src/infra/migrations/0002-add-application-users-and-operators.js";
import { up as migrate0003 } from "../src/infra/migrations/0003-add-audit-records.js";
import { up as migrate0004 } from "../src/infra/migrations/0004-add-voice-training-consents.js";
import { up as migrate0005 } from "../src/infra/migrations/0005-durable-runtime.js";

declare const process: {
  readonly env: Record<string, string | undefined>;
};

export interface PostgresTestContext {
  readonly pool: Pool;
  readonly db: Kysely<DatabaseTables>;
}

export const backendTestDatabaseUrl = process.env.BACKEND_TEST_DATABASE_URL;
export const runPostgresTests = process.env.RUN_POSTGRES_TESTS === "true";

let cachedPostgresAvailability: Promise<boolean> | undefined;

export function isPostgresTestDatabaseAvailable(): Promise<boolean> {
  if (cachedPostgresAvailability) {
    return cachedPostgresAvailability;
  }

  cachedPostgresAvailability = (async () => {
    if (!backendTestDatabaseUrl) {
      return false;
    }

    try {
      const pool = await Effect.runPromise(acquirePostgresPool(backendTestDatabaseUrl));
      await Effect.runPromise(releasePostgresPool(pool));
      return true;
    } catch {
      return false;
    }
  })();

  return cachedPostgresAvailability;
}

export async function shouldRunPostgresIntegrationTests(): Promise<boolean> {
  if (!runPostgresTests || !backendTestDatabaseUrl) {
    return false;
  }

  return isPostgresTestDatabaseAvailable();
}

export async function openPostgresTestDatabase(): Promise<PostgresTestContext> {
  if (!backendTestDatabaseUrl) {
    throw new Error("BACKEND_TEST_DATABASE_URL is required for PostgreSQL integration tests");
  }

  const pool = await Effect.runPromise(acquirePostgresPool(backendTestDatabaseUrl));
  const db = new Kysely<DatabaseTables>({
    dialect: new PostgresDialect({ pool })
  });

  await ensureTestSchema(db);

  return { pool, db };
}

export async function closePostgresTestDatabase(
  context: PostgresTestContext | undefined
): Promise<void> {
  if (!context) {
    return;
  }

  await Effect.runPromise(releasePostgresPool(context.pool));
}

export async function clearApplicationUsers(db: Kysely<DatabaseTables>): Promise<void> {
  await db.deleteFrom("application_users").execute();
}

export async function clearOperators(db: Kysely<DatabaseTables>): Promise<void> {
  await db.deleteFrom("operators").execute();
}

export async function clearAuditRecords(db: Kysely<DatabaseTables>): Promise<void> {
  await db.deleteFrom("audit_records").execute();
}

export async function clearDurableRuntimeTables(db: Kysely<DatabaseTables>): Promise<void> {
  await db.deleteFrom("execution_idempotency").execute();
  await db.deleteFrom("outbox_events").execute();
  await db.deleteFrom("billing_snapshots").execute();
  await db.deleteFrom("jobs").execute();
}

async function ensureTestSchema(db: Kysely<DatabaseTables>): Promise<void> {
  await sql`select pg_advisory_lock(94021431)`.execute(db);

  try {
    const existingTables = new Set(
      (await db.introspection.getTables({ withInternalKyselyTables: false })).map(
        (table) => table.name
      )
    );

    if (!existingTables.has("jobs")) {
      await migrate0001(db);
    }

    if (!existingTables.has("application_users") || !existingTables.has("operators")) {
      await migrate0002(db);
    }

    if (!existingTables.has("audit_records")) {
      await migrate0003(db);
    }

    if (!existingTables.has("voice_training_consents")) {
      await migrate0004(db);
    }

    if (!existingTables.has("billing_snapshots")) {
      await migrate0005(db);
    }
  } finally {
    await sql`select pg_advisory_unlock(94021431)`.execute(db);
  }
}
