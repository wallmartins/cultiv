import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import { Kysely, sql } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";
import type { BillingDbExecutor } from "./postgres-billing-repository.js";

// contract-08 decision 2 — billing is append-only by design (postgres-billing-repository.ts); this
// pseudonymization is the ONLY sanctioned mutation of that store. It severs the PII link
// (user_id/account_id) while keeping amounts/dates/plan/invoice-refs for fiscal retention.
export function generateAnonymizedBillingToken(): string {
  return `deleted-${randomUUID()}`;
}

// userId-prefixed columns: account_id is `${userId}:${planId}` and subscription_id/id is
// `${userId}:${planId}:subscription` (subscription-lookup.ts createSubscriptionId) — regexp_replace
// swaps ONLY the userId prefix so the plan/suffix survives, per "mantém... plano" in decision 2.
// Same transform + same token applied to every column below, so post-anonymization rows still join
// by string equality even though none of these are real FK constraints (migration 0012/0006 — plain
// varchar columns, no .addForeignKeyConstraint anywhere in the billing migrations).
function anonymizeUserIdPrefixedColumn(column: string, userId: string, token: string) {
  return sql<string>`regexp_replace(${sql.ref(column)}, '^' || ${userId}, ${token})`;
}

// contract-08 §5 task 3 — pseudonymizes EVERY column that can carry the userId, across every
// billing table, so no retained row is recoverable back to the person. This is the core guarantee
// of decision 2 ("token irreversível") — not a partial/optional pass: user_id AND account_id AND
// subscription_id/id all get the same treatment, because createSubscriptionId(userId, planId) puts
// the raw userId inside subscription_id/id too (packages/payments/src/subscription-lookup.ts:35).
export function anonymizeBillingForUser(
  executor: BillingDbExecutor,
  userId: string,
  token: string = generateAnonymizedBillingToken()
): Effect.Effect<{ readonly token: string }, Error> {
  const prefix = `${userId}:`;
  const prefixed = (column: string) => anonymizeUserIdPrefixedColumn(column, userId, token);

  return Effect.tryPromise({
    try: async () => {
      await executor
        .updateTable("billing_subscriptions")
        .set({ id: prefixed("id"), user_id: token })
        .where("user_id", "=", userId)
        .execute();

      await executor
        .updateTable("billing_usage_records")
        .set({ subscription_id: prefixed("subscription_id"), user_id: token })
        .where("user_id", "=", userId)
        .execute();

      await executor
        .updateTable("billing_ledger_entries")
        .set({ subscription_id: prefixed("subscription_id"), account_id: prefixed("account_id") })
        .where("account_id", "like", `${prefix}%`)
        .execute();

      await executor
        .updateTable("billing_reservations")
        .set({ subscription_id: prefixed("subscription_id"), account_id: prefixed("account_id") })
        .where("account_id", "like", `${prefix}%`)
        .execute();

      await executor
        .updateTable("billing_cycle_states")
        .set({ subscription_id: prefixed("subscription_id"), account_id: prefixed("account_id") })
        .where("account_id", "like", `${prefix}%`)
        .execute();

      // billing_gateway_subscriptions has no user_id/account_id column — subscription_id (PK) is
      // the only place the userId lives; it has no external_customer_id column either (that's only
      // on billing_gateway_customers, dropped below).
      await executor
        .updateTable("billing_gateway_subscriptions")
        .set({ subscription_id: prefixed("subscription_id") })
        .where("subscription_id", "like", `${prefix}%`)
        .execute();

      // not fiscal documents — the customer mapping and ephemeral checkout/idempotency rows are
      // dropped outright rather than pseudonymized (decision 2's "dropa external_customer_id").
      await executor.deleteFrom("billing_gateway_customers").where("user_id", "=", userId).execute();
      await executor.deleteFrom("billing_checkout_intents").where("user_id", "=", userId).execute();
      await executor
        .deleteFrom("billing_operation_idempotency")
        .where("operation_key", "like", `%${userId}%`)
        .execute();

      return { token };
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}

export function anonymizeBillingForUserInTransaction(
  db: Kysely<DatabaseTables>,
  userId: string
): Effect.Effect<{ readonly token: string }, Error> {
  return Effect.tryPromise({
    try: () => db.transaction().execute((trx) => Effect.runPromise(anonymizeBillingForUser(trx, userId))),
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}
