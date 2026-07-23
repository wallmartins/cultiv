import { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .createTable("practice_profiles")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(64)", (col) => col.notNull().unique())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("version", "integer", (col) => col.notNull().defaultTo(1))
    .execute();

  await db.schema
    .createTable("practice_profile_diagnostics")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(64)", (col) => col.notNull().unique())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("version", "integer", (col) => col.notNull().defaultTo(1))
    .execute();
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema.dropTable("practice_profile_diagnostics").ifExists().execute();
  await db.schema.dropTable("practice_profiles").ifExists().execute();
}
