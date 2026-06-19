// src/infra/migrations/0011-billing-topup-seed.ts
async function up(db) {
  const existing = await db.selectFrom("billing_top_up_packages").select("id").where("id", "=", "topup_500").executeTakeFirst();
  if (existing) {
    return;
  }
  await db.insertInto("billing_top_up_packages").values({
    id: "topup_500",
    credits: 500,
    price_cents: 2900,
    currency: "BRL",
    description: "500 credits top-up"
  }).execute();
}
async function down(db) {
  await db.deleteFrom("billing_top_up_packages").where("id", "=", "topup_500").execute();
}
export {
  down,
  up
};
//# sourceMappingURL=0011-billing-topup-seed.js.map
