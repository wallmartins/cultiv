import type { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .alterTable("billing_gateway_subscriptions")
    .addColumn("outstanding_invoice_url", "text")
    .execute();
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .alterTable("billing_gateway_subscriptions")
    .dropColumn("outstanding_invoice_url")
    .execute();
}
