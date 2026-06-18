import { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

// Dev placeholder external IDs — replace with real provider IDs in production.
const DEV_CATALOG_SEED_ROWS = [
  {
    id: "gw-catalog-pro-monthly-brl",
    product_kind: "subscription",
    internal_ref: "pro",
    currency: "BRL",
    gateway: "asaas",
    billing_period: "monthly",
    external_product_id: "dev-stub-pro-monthly-brl",
    external_price_id: "dev-stub-pro-monthly-brl"
  },
  {
    id: "gw-catalog-pro-monthly-usd",
    product_kind: "subscription",
    internal_ref: "pro",
    currency: "USD",
    gateway: "stripe",
    billing_period: "monthly",
    external_product_id: "dev-stub-pro-monthly-usd",
    external_price_id: "dev-stub-pro-monthly-usd"
  },
  {
    id: "gw-catalog-pro-annual-brl",
    product_kind: "subscription",
    internal_ref: "pro",
    currency: "BRL",
    gateway: "asaas",
    billing_period: "annual",
    external_product_id: "dev-stub-pro-annual-brl",
    external_price_id: "dev-stub-pro-annual-brl"
  },
  {
    id: "gw-catalog-pro-annual-usd",
    product_kind: "subscription",
    internal_ref: "pro",
    currency: "USD",
    gateway: "stripe",
    billing_period: "annual",
    external_product_id: "dev-stub-pro-annual-usd",
    external_price_id: "dev-stub-pro-annual-usd"
  },
  {
    id: "gw-catalog-topup-500-brl",
    product_kind: "topup",
    internal_ref: "topup_500",
    currency: "BRL",
    gateway: "asaas",
    billing_period: "one_time",
    external_product_id: "dev-stub-topup-500-brl",
    external_price_id: "dev-stub-topup-500-brl"
  },
  {
    id: "gw-catalog-topup-500-usd",
    product_kind: "topup",
    internal_ref: "topup_500",
    currency: "USD",
    gateway: "stripe",
    billing_period: "one_time",
    external_product_id: "dev-stub-topup-500-usd",
    external_price_id: "dev-stub-topup-500-usd"
  }
] as const;

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .createTable("billing_gateway_catalog")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("product_kind", "varchar(32)", (col) => col.notNull())
    .addColumn("internal_ref", "varchar(64)", (col) => col.notNull())
    .addColumn("currency", "varchar(8)", (col) => col.notNull())
    .addColumn("gateway", "varchar(16)", (col) => col.notNull())
    .addColumn("billing_period", "varchar(16)", (col) => col.notNull())
    .addColumn("external_product_id", "varchar(255)", (col) => col.notNull())
    .addColumn("external_price_id", "varchar(255)", (col) => col.notNull())
    .addColumn("active", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex("billing_gateway_catalog_lookup_idx")
    .on("billing_gateway_catalog")
    .columns(["product_kind", "internal_ref", "currency", "billing_period", "active"])
    .execute();

  await db.schema
    .createTable("billing_gateway_customers")
    .addColumn("user_id", "varchar(64)", (col) => col.notNull())
    .addColumn("gateway", "varchar(16)", (col) => col.notNull())
    .addColumn("external_customer_id", "varchar(255)", (col) => col.notNull())
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .addPrimaryKeyConstraint("billing_gateway_customers_pkey", ["user_id", "gateway"])
    .execute();

  await db.schema
    .createTable("billing_gateway_subscriptions")
    .addColumn("subscription_id", "varchar(128)", (col) => col.primaryKey())
    .addColumn("gateway", "varchar(16)", (col) => col.notNull())
    .addColumn("external_subscription_id", "varchar(255)", (col) => col.notNull())
    .addColumn("status", "varchar(32)", (col) => col.notNull())
    .addColumn("currency", "varchar(8)", (col) => col.notNull())
    .addColumn("updated_at", "varchar(64)", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("billing_checkout_intents")
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(64)", (col) => col.notNull())
    .addColumn("product_kind", "varchar(32)", (col) => col.notNull())
    .addColumn("internal_ref", "varchar(64)", (col) => col.notNull())
    .addColumn("currency", "varchar(8)", (col) => col.notNull())
    .addColumn("gateway", "varchar(16)", (col) => col.notNull())
    .addColumn("status", "varchar(32)", (col) => col.notNull())
    .addColumn("external_session_id", "varchar(255)")
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .addColumn("completed_at", "varchar(64)")
    .execute();

  await db.schema
    .createIndex("billing_checkout_intents_user_status_idx")
    .on("billing_checkout_intents")
    .columns(["user_id", "status"])
    .execute();

  await db.schema
    .createTable("billing_gateway_events")
    .addColumn("event_id", "varchar(255)", (col) => col.primaryKey())
    .addColumn("gateway", "varchar(16)", (col) => col.notNull())
    .addColumn("event_type", "varchar(128)", (col) => col.notNull())
    .addColumn("processed_at", "varchar(64)", (col) => col.notNull())
    .addColumn("payload_hash", "varchar(128)")
    .execute();

  const createdAt = new Date().toISOString();

  for (const row of DEV_CATALOG_SEED_ROWS) {
    await db
      .insertInto("billing_gateway_catalog")
      .values({
        ...row,
        active: true,
        created_at: createdAt
      })
      .execute();
  }
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema.dropTable("billing_gateway_events").execute();
  await db.schema.dropTable("billing_checkout_intents").execute();
  await db.schema.dropTable("billing_gateway_subscriptions").execute();
  await db.schema.dropTable("billing_gateway_customers").execute();
  await db.schema.dropTable("billing_gateway_catalog").execute();
}
