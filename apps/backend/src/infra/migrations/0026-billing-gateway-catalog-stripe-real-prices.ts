import { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

// 0013/0017 seeded billing_gateway_catalog with placeholder "dev-stub-*" values for the
// gateway=stripe rows. The stripe adapter (packages/payments/src/gateway/stripe-adapter.ts)
// passes external_price_id straight through as the Stripe line_items[].price — a placeholder
// isn't a real Price ID, so checkout.sessions.create failed for every USD plan. This backfills
// the real Product/Price ids created directly in the live Stripe account for the 3 active plans
// (Explorador/Criador/Profissional), monthly + annual, in USD.
const STRIPE_REAL_IDS: readonly { readonly id: string; readonly productId: string; readonly priceId: string }[] = [
  { id: "gw-catalog-explorador-monthly-usd", productId: "prod_Uw47OEAh7Ko3Ty", priceId: "price_1TwBzXFXCZUIBijAEYO4KaWf" },
  { id: "gw-catalog-explorador-annual-usd", productId: "prod_Uw47OEAh7Ko3Ty", priceId: "price_1TwBzYFXCZUIBijA8kwnuhoI" },
  { id: "gw-catalog-criador-monthly-usd", productId: "prod_Uw479RaYg2hDRB", priceId: "price_1TwBzYFXCZUIBijARR4K2MSr" },
  { id: "gw-catalog-criador-annual-usd", productId: "prod_Uw479RaYg2hDRB", priceId: "price_1TwBzYFXCZUIBijAV1v2CyGX" },
  { id: "gw-catalog-profissional-monthly-usd", productId: "prod_Uw47QSkMq4JHeN", priceId: "price_1TwBzZFXCZUIBijA7iLhJF9x" },
  { id: "gw-catalog-profissional-annual-usd", productId: "prod_Uw47QSkMq4JHeN", priceId: "price_1TwBzZFXCZUIBijAR0P7d6xY" }
] as const;

const PREVIOUS_DEV_STUB_VALUES: Readonly<Record<string, string>> = {
  "gw-catalog-explorador-monthly-usd": "dev-stub-explorador-monthly-usd",
  "gw-catalog-explorador-annual-usd": "dev-stub-explorador-annual-usd",
  "gw-catalog-criador-monthly-usd": "dev-stub-criador-monthly-usd",
  "gw-catalog-criador-annual-usd": "dev-stub-criador-annual-usd",
  "gw-catalog-profissional-monthly-usd": "dev-stub-profissional-monthly-usd",
  "gw-catalog-profissional-annual-usd": "dev-stub-profissional-annual-usd"
};

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  for (const row of STRIPE_REAL_IDS) {
    await db
      .updateTable("billing_gateway_catalog")
      .set({ external_product_id: row.productId, external_price_id: row.priceId })
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
