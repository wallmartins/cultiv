import { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .createTable("voice_training_consents")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(64)", (col) => col.notNull().unique())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("version", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .addColumn("updated_at", "varchar(64)", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema.dropTable("voice_training_consents").ifExists().execute();
}
