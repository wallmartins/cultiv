import { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .createTable("application_users")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("external_subject", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("status", "varchar(16)", (col) => col.notNull().defaultTo("active"))
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .addColumn("updated_at", "varchar(64)", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("operators")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("permissions", "jsonb", (col) => col.notNull().defaultTo("[]"))
    .addColumn("roles", "jsonb", (col) => col.notNull().defaultTo("[]"))
    .addColumn("status", "varchar(16)", (col) => col.notNull().defaultTo("active"))
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .addColumn("updated_at", "varchar(64)", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema.dropTable("operators").ifExists().execute();
  await db.schema.dropTable("application_users").ifExists().execute();
}
