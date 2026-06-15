import { Kysely, sql } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .alterTable("jobs")
    .addColumn("user_id", "varchar(64)")
    .execute();

  await db.schema
    .createIndex("jobs_user_id_created_at_idx")
    .on("jobs")
    .columns(["user_id", "created_at"])
    .execute();

  await db.schema
    .createTable("billing_snapshots")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("updated_at", "varchar(64)", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("outbox_events")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("aggregate_type", "varchar(64)", (col) => col.notNull())
    .addColumn("aggregate_id", "varchar(64)", (col) => col.notNull())
    .addColumn("event_type", "varchar(128)", (col) => col.notNull())
    .addColumn("payload", "jsonb", (col) => col.notNull())
    .addColumn("occurred_at", "varchar(64)", (col) => col.notNull())
    .addColumn("published_at", "varchar(64)")
    .execute();

  await sql`create index outbox_events_unpublished_idx on outbox_events (occurred_at) where published_at is null`.execute(
    db
  );

  await db.schema
    .createTable("execution_idempotency")
    .addColumn("user_id", "varchar(64)", (col) => col.notNull())
    .addColumn("idempotency_key", "varchar(255)", (col) => col.notNull())
    .addColumn("fingerprint", "text", (col) => col.notNull())
    .addColumn("execution_id", "varchar(64)", (col) => col.notNull())
    .addColumn("response", "jsonb", (col) => col.notNull())
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .addPrimaryKeyConstraint("execution_idempotency_pkey", ["user_id", "idempotency_key"])
    .execute();
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema.dropTable("execution_idempotency").execute();
  await db.schema.dropTable("outbox_events").execute();
  await db.schema.dropTable("billing_snapshots").execute();
  await db.schema.dropIndex("jobs_user_id_created_at_idx").execute();
  await db.schema.alterTable("jobs").dropColumn("user_id").execute();
}
