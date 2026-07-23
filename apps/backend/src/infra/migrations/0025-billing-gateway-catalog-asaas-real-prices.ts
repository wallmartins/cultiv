import { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

// 0012/0013/0017 seeded billing_gateway_catalog with placeholder "dev-stub-*" values for both
// external_product_id and external_price_id. The asaas adapter (packages/payments/src/gateway/
// asaas-adapter.ts, priceValueFromExternalId) parses external_price_id as the charge amount —
// a non-numeric placeholder falls back to charging 1, which broke checkout redirects in
// production. This backfills real BRL amounts from catalog-pricing.json (annual = 20% off
// monthly, billed as one payment split across 12 installments — the adapter passes the annual
// total as `value` with installmentCount: 12).
const ASAAS_REAL_PRICES: readonly { readonly id: string; readonly value: string }[] = [
  { id: "gw-catalog-explorador-monthly-brl", value: "49.00" },
  { id: "gw-catalog-explorador-annual-brl", value: "470.40" },
  { id: "gw-catalog-criador-monthly-brl", value: "99.00" },
  { id: "gw-catalog-criador-annual-brl", value: "950.40" },
  { id: "gw-catalog-profissional-monthly-brl", value: "249.00" },
  { id: "gw-catalog-profissional-annual-brl", value: "2390.40" },
  { id: "gw-catalog-topup-500-brl", value: "29.00" }
] as const;

const PREVIOUS_DEV_STUB_VALUES: Readonly<Record<string, string>> = {
  "gw-catalog-explorador-monthly-brl": "dev-stub-explorador-monthly-brl",
  "gw-catalog-explorador-annual-brl": "dev-stub-explorador-annual-brl",
  "gw-catalog-criador-monthly-brl": "dev-stub-criador-monthly-brl",
  "gw-catalog-criador-annual-brl": "dev-stub-criador-annual-brl",
  "gw-catalog-profissional-monthly-brl": "dev-stub-profissional-monthly-brl",
  "gw-catalog-profissional-annual-brl": "dev-stub-profissional-annual-brl",
  "gw-catalog-topup-500-brl": "dev-stub-topup-500-brl"
};

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  for (const row of ASAAS_REAL_PRICES) {
    await db
      .updateTable("billing_gateway_catalog")
      .set({ external_product_id: row.value, external_price_id: row.value })
      .where("id", "=", row.id)
      .execute();
  }
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  for (const [id, value] of Object.entries(PREVIOUS_DEV_STUB_VALUES)) {
    await db
      .updateTable("billing_gateway_catalog")
      .set({ external_product_id: value, external_price_id: value })
      .where("id", "=", id)
      .execute();
  }
}
