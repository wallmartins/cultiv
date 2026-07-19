import type { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .alterTable("application_users")
    .addColumn("onboarding_completed_at", "varchar(64)", (col) => col.defaultTo(null))
    .execute();
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .alterTable("application_users")
    .dropColumn("onboarding_completed_at")
    .execute();
}
