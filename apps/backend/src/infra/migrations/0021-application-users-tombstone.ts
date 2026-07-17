import type { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

// contract-08 §4/decision 4 — terminal account state is a tombstone: status="deleted" + deleted_at,
// id/external_subject retained so audit actorId stays valid and the row can never be resurrected.
export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .alterTable("application_users")
    .addColumn("deleted_at", "varchar(64)", (col) => col.defaultTo(null))
    .execute();
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema.alterTable("application_users").dropColumn("deleted_at").execute();
}
