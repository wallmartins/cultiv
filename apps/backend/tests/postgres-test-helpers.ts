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
import { up as migrate0006 } from "../src/infra/migrations/0006-billing-relational.js";
import { up as migrate0012 } from "../src/infra/migrations/0012-billing-gateway.js";
import { up as migrate0015 } from "../src/infra/migrations/0015-add-onboarding-completion.js";
import { up as migrate0016 } from "../src/infra/migrations/0016-billing-status-lifecycle-fields.js";
import { up as migrate0018 } from "../src/infra/migrations/0018-billing-lifecycle-management-fields.js";
import { up as migrate0019 } from "../src/infra/migrations/0019-execution-reactions.js";
import { up as migrate0021 } from "../src/infra/migrations/0021-application-users-tombstone.js";
import { up as migrate0024 } from "../src/infra/migrations/0024-practice-profile.js";

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

export async function clearBillingRelationalTables(db: Kysely<DatabaseTables>): Promise<void> {
  const tables = await db.introspection.getTables({ withInternalKyselyTables: false });
  if (!tables.some((table) => table.name === "billing_plans")) {
    return;
  }

  await db.deleteFrom("billing_operation_idempotency").execute();
  await db.deleteFrom("billing_reservations").execute();
  await db.deleteFrom("billing_ledger_entries").execute();
  await db.deleteFrom("billing_usage_records").execute();
  await db.deleteFrom("billing_cycle_states").execute();
  await db.deleteFrom("billing_top_up_packages").execute();
  await db.deleteFrom("billing_subscriptions").execute();
  await db.deleteFrom("billing_plans").execute();
}

export async function clearDurableRuntimeTables(db: Kysely<DatabaseTables>): Promise<void> {
  await clearBillingRelationalTables(db);
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

    if (!existingTables.has("billing_plans")) {
      await migrate0006(db);
    }

    if (!existingTables.has("billing_gateway_catalog")) {
      await migrate0012(db);
    }

    // contract-08 — column-level additions on already-created tables need a column check, not a
    // table-existence check.
    const tablesWithColumns = await db.introspection.getTables({ withInternalKyselyTables: false });
    const applicationUsersTableForOnboarding = tablesWithColumns.find((table) => table.name === "application_users");
    if (
      applicationUsersTableForOnboarding &&
      !applicationUsersTableForOnboarding.columns.some((column) => column.name === "onboarding_completed_at")
    ) {
      await migrate0015(db);
    }

    const billingSubscriptionsTable = tablesWithColumns.find((table) => table.name === "billing_subscriptions");
    if (billingSubscriptionsTable && !billingSubscriptionsTable.columns.some((column) => column.name === "trial_ends_at")) {
      await migrate0016(db);
    }

    const billingGatewaySubscriptionsTable = tablesWithColumns.find(
      (table) => table.name === "billing_gateway_subscriptions"
    );
    if (
      billingGatewaySubscriptionsTable &&
      !billingGatewaySubscriptionsTable.columns.some((column) => column.name === "outstanding_invoice_url")
    ) {
      await migrate0018(db);
    }

    if (!existingTables.has("execution_reactions")) {
      await migrate0019(db);
    }

    const applicationUsersTable = tablesWithColumns.find((table) => table.name === "application_users");
    if (applicationUsersTable && !applicationUsersTable.columns.some((column) => column.name === "deleted_at")) {
      await migrate0021(db);
    }

    if (!existingTables.has("practice_profiles")) {
      await migrate0024(db);
    }
  } finally {
    await sql`select pg_advisory_unlock(94021431)`.execute(db);
  }
}
