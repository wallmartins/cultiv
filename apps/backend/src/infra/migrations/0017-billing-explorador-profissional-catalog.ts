import { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

const EXPLORADOR_PROFISSIONAL_CATALOG_ROWS = [
  {
    id: "gw-catalog-explorador-monthly-brl",
    product_kind: "subscription",
    internal_ref: "explorador",
    currency: "BRL",
    gateway: "asaas",
    billing_period: "monthly",
    external_product_id: "dev-stub-explorador-monthly-brl",
    external_price_id: "dev-stub-explorador-monthly-brl"
  },
  {
    id: "gw-catalog-explorador-monthly-usd",
    product_kind: "subscription",
    internal_ref: "explorador",
    currency: "USD",
    gateway: "stripe",
    billing_period: "monthly",
    external_product_id: "dev-stub-explorador-monthly-usd",
    external_price_id: "dev-stub-explorador-monthly-usd"
  },
  {
    id: "gw-catalog-explorador-annual-brl",
    product_kind: "subscription",
    internal_ref: "explorador",
    currency: "BRL",
    gateway: "asaas",
    billing_period: "annual",
    external_product_id: "dev-stub-explorador-annual-brl",
    external_price_id: "dev-stub-explorador-annual-brl"
  },
  {
    id: "gw-catalog-explorador-annual-usd",
    product_kind: "subscription",
    internal_ref: "explorador",
    currency: "USD",
    gateway: "stripe",
    billing_period: "annual",
    external_product_id: "dev-stub-explorador-annual-usd",
    external_price_id: "dev-stub-explorador-annual-usd"
  },
  {
    id: "gw-catalog-profissional-monthly-brl",
    product_kind: "subscription",
    internal_ref: "profissional",
    currency: "BRL",
    gateway: "asaas",
    billing_period: "monthly",
    external_product_id: "dev-stub-profissional-monthly-brl",
    external_price_id: "dev-stub-profissional-monthly-brl"
  },
  {
    id: "gw-catalog-profissional-monthly-usd",
    product_kind: "subscription",
    internal_ref: "profissional",
    currency: "USD",
    gateway: "stripe",
    billing_period: "monthly",
    external_product_id: "dev-stub-profissional-monthly-usd",
    external_price_id: "dev-stub-profissional-monthly-usd"
  },
  {
    id: "gw-catalog-profissional-annual-brl",
    product_kind: "subscription",
    internal_ref: "profissional",
    currency: "BRL",
    gateway: "asaas",
    billing_period: "annual",
    external_product_id: "dev-stub-profissional-annual-brl",
    external_price_id: "dev-stub-profissional-annual-brl"
  },
  {
    id: "gw-catalog-profissional-annual-usd",
    product_kind: "subscription",
    internal_ref: "profissional",
    currency: "USD",
    gateway: "stripe",
    billing_period: "annual",
    external_product_id: "dev-stub-profissional-annual-usd",
    external_price_id: "dev-stub-profissional-annual-usd"
  }
] as const;

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  const createdAt = new Date().toISOString();

  for (const row of EXPLORADOR_PROFISSIONAL_CATALOG_ROWS) {
    const existing = await db
      .selectFrom("billing_gateway_catalog")
      .select("id")
      .where("id", "=", row.id)
      .executeTakeFirst();

    if (existing) {
      continue;
    }

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
  await db
    .deleteFrom("billing_gateway_catalog")
    .where(
      "id",
      "in",
      EXPLORADOR_PROFISSIONAL_CATALOG_ROWS.map((row) => row.id)
    )
    .execute();
}
