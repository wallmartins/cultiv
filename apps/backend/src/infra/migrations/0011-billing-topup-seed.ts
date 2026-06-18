import { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  const existing = await db
    .selectFrom("billing_top_up_packages")
    .select("id")
    .where("id", "=", "topup_500")
    .executeTakeFirst();

  if (existing) {
    return;
  }

  await db
    .insertInto("billing_top_up_packages")
    .values({
      id: "topup_500",
      credits: 500,
      price_cents: 2900,
      currency: "BRL",
      description: "500 credits top-up"
    })
    .execute();
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.deleteFrom("billing_top_up_packages").where("id", "=", "topup_500").execute();
}
