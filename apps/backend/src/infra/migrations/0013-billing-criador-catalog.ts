import { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

const CRIADOR_CATALOG_ROWS = [
  {
    id: "gw-catalog-criador-monthly-brl",
    product_kind: "subscription",
    internal_ref: "criador",
    currency: "BRL",
    gateway: "asaas",
    billing_period: "monthly",
    external_product_id: "dev-stub-criador-monthly-brl",
    external_price_id: "dev-stub-criador-monthly-brl"
  },
  {
    id: "gw-catalog-criador-monthly-usd",
    product_kind: "subscription",
    internal_ref: "criador",
    currency: "USD",
    gateway: "stripe",
    billing_period: "monthly",
    external_product_id: "dev-stub-criador-monthly-usd",
    external_price_id: "dev-stub-criador-monthly-usd"
  },
  {
    id: "gw-catalog-criador-annual-brl",
    product_kind: "subscription",
    internal_ref: "criador",
    currency: "BRL",
    gateway: "asaas",
    billing_period: "annual",
    external_product_id: "dev-stub-criador-annual-brl",
    external_price_id: "dev-stub-criador-annual-brl"
  },
  {
    id: "gw-catalog-criador-annual-usd",
    product_kind: "subscription",
    internal_ref: "criador",
    currency: "USD",
    gateway: "stripe",
    billing_period: "annual",
    external_product_id: "dev-stub-criador-annual-usd",
    external_price_id: "dev-stub-criador-annual-usd"
  }
] as const;

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  const createdAt = new Date().toISOString();

  for (const row of CRIADOR_CATALOG_ROWS) {
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
      CRIADOR_CATALOG_ROWS.map((row) => row.id)
    )
    .execute();
}
