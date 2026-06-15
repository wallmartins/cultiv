import { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .createTable("audit_records")
    .addColumn("id", "varchar(128)", (col) => col.primaryKey())
    .addColumn("logical_key", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("actor_id", "varchar(128)", (col) => col.notNull())
    .addColumn("actor_type", "varchar(32)", (col) => col.notNull())
    .addColumn("resource_type", "varchar(64)", (col) => col.notNull())
    .addColumn("resource_id", "varchar(255)", (col) => col.notNull())
    .addColumn("mutation_type", "varchar(128)", (col) => col.notNull())
    .addColumn("occurred_at", "varchar(64)", (col) => col.notNull())
    .addColumn("metadata", "jsonb", (col) => col.notNull().defaultTo("{}"))
    .execute();
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema.dropTable("audit_records").ifExists().execute();
}
