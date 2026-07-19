import type { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .alterTable("billing_subscriptions")
    .addColumn("trial_ends_at", "varchar(64)")
    .addColumn("renews_at", "varchar(64)")
    .addColumn("ever_subscribed", "boolean", (col) => col.notNull().defaultTo(false))
    .execute();

  await db.schema
    .alterTable("billing_gateway_subscriptions")
    .addColumn("payment_method_kind", "varchar(16)")
    .addColumn("payment_method_brand_last4", "varchar(8)")
    .execute();
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .alterTable("billing_gateway_subscriptions")
    .dropColumn("payment_method_kind")
    .dropColumn("payment_method_brand_last4")
    .execute();

  await db.schema
    .alterTable("billing_subscriptions")
    .dropColumn("trial_ends_at")
    .dropColumn("renews_at")
    .dropColumn("ever_subscribed")
    .execute();
}
