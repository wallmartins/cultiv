import { Effect } from "effect";
import { Kysely, sql } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";
import { backfillBillingSnapshotIntoRelationalTables } from "../postgres-billing-store.js";

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .createTable("billing_plans")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("billing_subscriptions")
    .addColumn("id", "varchar(128)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(64)", (col) => col.notNull())
    .addColumn("plan_id", "varchar(64)", (col) => col.notNull())
    .addColumn("status", "varchar(32)", (col) => col.notNull())
    .addColumn("started_at", "varchar(64)", (col) => col.notNull())
    .addColumn("renewed_at", "varchar(64)")
    .addColumn("expires_at", "varchar(64)")
    .execute();

  await db.schema
    .createIndex("billing_subscriptions_user_id_idx")
    .on("billing_subscriptions")
    .column("user_id")
    .execute();

  await db.schema
    .createIndex("billing_subscriptions_user_plan_idx")
    .on("billing_subscriptions")
    .columns(["user_id", "plan_id"])
    .execute();

  await db.schema
    .createTable("billing_usage_records")
    .addColumn("id", "varchar(128)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(64)", (col) => col.notNull())
    .addColumn("plan_id", "varchar(64)", (col) => col.notNull())
    .addColumn("subscription_id", "varchar(128)", (col) => col.notNull())
    .addColumn("kind", "varchar(32)", (col) => col.notNull())
    .addColumn("amount", "double precision", (col) => col.notNull())
    .addColumn("credits", "double precision", (col) => col.notNull())
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .addColumn("metadata", "jsonb", (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .execute();

  await db.schema
    .createIndex("billing_usage_records_user_id_idx")
    .on("billing_usage_records")
    .column("user_id")
    .execute();

  await db.schema
    .createTable("billing_ledger_entries")
    .addColumn("id", "bigserial", (col) => col.primaryKey())
    .addColumn("subscription_id", "varchar(128)", (col) => col.notNull())
    .addColumn("account_id", "varchar(128)", (col) => col.notNull())
    .addColumn("entry_type", "varchar(32)", (col) => col.notNull())
    .addColumn("credits_delta", "double precision", (col) => col.notNull())
    .addColumn("balance_after", "double precision", (col) => col.notNull())
    .addColumn("reference_type", "varchar(32)", (col) => col.notNull())
    .addColumn("reference_id", "varchar(255)", (col) => col.notNull())
    .addColumn("idempotency_key", "varchar(255)", (col) => col.notNull())
    .addColumn("metadata", "jsonb", (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .execute();

  await sql`create unique index billing_ledger_entries_idempotency_key_idx on billing_ledger_entries (idempotency_key)`.execute(
    db
  );

  await db.schema
    .createIndex("billing_ledger_entries_account_created_idx")
    .on("billing_ledger_entries")
    .columns(["account_id", "id"])
    .execute();

  await db.schema
    .createTable("billing_reservations")
    .addColumn("reservation_id", "varchar(255)", (col) => col.primaryKey())
    .addColumn("generation_cycle_id", "varchar(255)", (col) => col.notNull())
    .addColumn("subscription_id", "varchar(128)", (col) => col.notNull())
    .addColumn("account_id", "varchar(128)", (col) => col.notNull())
    .addColumn("quality_mode", "varchar(16)", (col) => col.notNull())
    .addColumn("retry_count", "integer", (col) => col.notNull())
    .addColumn("reserved_credits", "double precision", (col) => col.notNull())
    .addColumn("status", "varchar(16)", (col) => col.notNull())
    .addColumn("idempotency_key", "varchar(255)", (col) => col.notNull())
    .addColumn("metadata", "jsonb", (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .addColumn("updated_at", "varchar(64)", (col) => col.notNull())
    .execute();

  await sql`create unique index billing_reservations_idempotency_key_idx on billing_reservations (idempotency_key)`.execute(
    db
  );

  await db.schema
    .createIndex("billing_reservations_account_status_idx")
    .on("billing_reservations")
    .columns(["account_id", "status"])
    .execute();

  await db.schema
    .createTable("billing_cycle_states")
    .addColumn("account_id", "varchar(128)", (col) => col.primaryKey())
    .addColumn("cycle_id", "varchar(255)", (col) => col.notNull())
    .addColumn("subscription_id", "varchar(128)", (col) => col.notNull())
    .addColumn("opened_at", "varchar(64)", (col) => col.notNull())
    .addColumn("closed_at", "varchar(64)")
    .addColumn("rollover_credits", "double precision", (col) => col.notNull())
    .addColumn("granted_credits", "double precision", (col) => col.notNull())
    .addColumn("expired_credits", "double precision", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("billing_top_up_packages")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("credits", "double precision", (col) => col.notNull())
    .addColumn("price_cents", "integer", (col) => col.notNull())
    .addColumn("currency", "varchar(8)", (col) => col.notNull())
    .addColumn("description", "text")
    .execute();

  await db.schema
    .createTable("billing_operation_idempotency")
    .addColumn("operation_key", "varchar(512)", (col) => col.primaryKey())
    .addColumn("result", "jsonb", (col) => col.notNull())
    .execute();

  await Effect.runPromise(backfillBillingSnapshotIntoRelationalTables(db));
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema.dropTable("billing_operation_idempotency").execute();
  await db.schema.dropTable("billing_top_up_packages").execute();
  await db.schema.dropTable("billing_cycle_states").execute();
  await db.schema.dropTable("billing_reservations").execute();
  await db.schema.dropTable("billing_ledger_entries").execute();
  await db.schema.dropTable("billing_usage_records").execute();
  await db.schema.dropTable("billing_subscriptions").execute();
  await db.schema.dropTable("billing_plans").execute();
}
