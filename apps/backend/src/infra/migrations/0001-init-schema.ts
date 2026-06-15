import { Kysely, sql } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .createTable("jobs")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("version", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .addColumn("updated_at", "varchar(64)", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("memories")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(64)", (col) => col.notNull())
    .addColumn("key", "varchar(255)", (col) => col.notNull())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("version", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .addColumn("updated_at", "varchar(64)", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("content_types")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("version", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("updated_at", "varchar(64)", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("pipelines")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("version", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("updated_at", "varchar(64)", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("voice_examples")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(64)", (col) => col.notNull())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("version", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("voice_profiles")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(64)", (col) => col.notNull().unique())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("version", "integer", (col) => col.notNull().defaultTo(1))
    .execute();

  await db.schema
    .createTable("voice_profile_diagnostics")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(64)", (col) => col.notNull().unique())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("version", "integer", (col) => col.notNull().defaultTo(1))
    .execute();

  await db.schema
    .createTable("voice_profile_snapshots")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(64)", (col) => col.notNull())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("version", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("voice_example_batches")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(64)", (col) => col.notNull())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("version", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .addColumn("updated_at", "varchar(64)", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema.dropTable("voice_example_batches").ifExists().execute();
  await db.schema.dropTable("voice_profile_snapshots").ifExists().execute();
  await db.schema.dropTable("voice_profile_diagnostics").ifExists().execute();
  await db.schema.dropTable("voice_profiles").ifExists().execute();
  await db.schema.dropTable("voice_examples").ifExists().execute();
  await db.schema.dropTable("pipelines").ifExists().execute();
  await db.schema.dropTable("content_types").ifExists().execute();
  await db.schema.dropTable("memories").ifExists().execute();
  await db.schema.dropTable("jobs").ifExists().execute();
}
