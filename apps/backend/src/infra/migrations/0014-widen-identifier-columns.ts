import { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .alterTable("voice_profile_snapshots")
    .alterColumn("id", (col) => col.setDataType("varchar(128)"))
    .execute();

  await db.schema
    .alterTable("jobs")
    .alterColumn("user_id", (col) => col.setDataType("varchar(128)"))
    .execute();

  await db.schema
    .alterTable("billing_subscriptions")
    .alterColumn("user_id", (col) => col.setDataType("varchar(128)"))
    .alterColumn("plan_id", (col) => col.setDataType("varchar(128)"))
    .execute();

  await db.schema
    .alterTable("billing_usage_records")
    .alterColumn("user_id", (col) => col.setDataType("varchar(128)"))
    .alterColumn("plan_id", (col) => col.setDataType("varchar(128)"))
    .execute();

  await db.schema
    .alterTable("execution_idempotency")
    .alterColumn("user_id", (col) => col.setDataType("varchar(128)"))
    .execute();
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .alterTable("execution_idempotency")
    .alterColumn("user_id", (col) => col.setDataType("varchar(64)"))
    .execute();

  await db.schema
    .alterTable("billing_usage_records")
    .alterColumn("user_id", (col) => col.setDataType("varchar(64)"))
    .alterColumn("plan_id", (col) => col.setDataType("varchar(64)"))
    .execute();

  await db.schema
    .alterTable("billing_subscriptions")
    .alterColumn("user_id", (col) => col.setDataType("varchar(64)"))
    .alterColumn("plan_id", (col) => col.setDataType("varchar(64)"))
    .execute();

  await db.schema
    .alterTable("jobs")
    .alterColumn("user_id", (col) => col.setDataType("varchar(64)"))
    .execute();

  await db.schema
    .alterTable("voice_profile_snapshots")
    .alterColumn("id", (col) => col.setDataType("varchar(64)"))
    .execute();
}
