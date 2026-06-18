import type { BillingCycleState } from "@my-ai-orchestrator/contracts";
import { Effect } from "effect";
import { createAccountId } from "./billing-utils.js";
import type { BillingServiceRuntimeContext } from "./billing-service-runtime.js";
import { calculateRolloverCredits } from "./credit-policy.js";
import { BillingEntitlementNotFoundError, BillingPlanNotFoundError } from "./errors.js";
import { appendLedgerEntry, createWalletFromRepository } from "./ledger.js";
import { findSubscription } from "./subscription-lookup.js";
import type { BillingStartCycleRequest } from "./types.js";

export function startCycle(ctx: BillingServiceRuntimeContext) {
  return (request: BillingStartCycleRequest) =>
    ctx.rememberOperation(ctx.repository, "startCycle", request.idempotencyKey, () =>
      Effect.gen(function* () {
        const plan = ctx.repository.plans.get(request.planId);
        if (!plan) {
          return yield* Effect.fail(new BillingPlanNotFoundError({ planId: request.planId }));
        }

        const subscription = findSubscription(ctx.repository, request.userId, request.planId);
        if (!subscription) {
          return yield* Effect.fail(
            new BillingEntitlementNotFoundError({ userId: request.userId, planId: request.planId })
          );
        }

        const accountId = createAccountId(request.userId, request.planId);
        const openedAt = ctx.clock.now().toISOString();
        const previousState = ctx.repository.cycleStates.get(accountId);
        let rolloverCredits = 0;
        let expiredCredits = 0;

        if (previousState && previousState.closedAt === null) {
          const wallet = createWalletFromRepository(ctx.repository, request.userId, request.planId);
          const remaining = wallet?.availableCredits ?? 0;
          rolloverCredits = calculateRolloverCredits(remaining, ctx.creditPolicy);
          expiredCredits = remaining;

          if (remaining > 0) {
            appendLedgerEntry(ctx.repository, {
              subscriptionId: subscription.id,
              accountId,
              entryType: "expire",
              creditsDelta: -remaining,
              referenceType: "subscription_cycle",
              referenceId: previousState.cycleId,
              idempotencyKey: `${request.idempotencyKey}:expire`,
              metadata: {
                nextCycleId: request.cycleId
              },
              createdAt: openedAt
            });
          }
        }

        if (rolloverCredits > 0) {
          appendLedgerEntry(ctx.repository, {
            subscriptionId: subscription.id,
            accountId,
            entryType: "grant_rollover",
            creditsDelta: rolloverCredits,
            referenceType: "subscription_cycle",
            referenceId: request.cycleId,
            idempotencyKey: `${request.idempotencyKey}:rollover`,
            metadata: {
              sourceCycleId: previousState?.cycleId ?? null
            },
            createdAt: openedAt
          });
        }

        appendLedgerEntry(ctx.repository, {
          subscriptionId: subscription.id,
          accountId,
          entryType: "grant_cycle",
          creditsDelta: plan.monthlyCredits,
          referenceType: "subscription_cycle",
          referenceId: request.cycleId,
          idempotencyKey: `${request.idempotencyKey}:grant_cycle`,
          metadata: {
            planId: plan.id
          },
          createdAt: openedAt
        });

        const cycleState: BillingCycleState = {
          cycleId: request.cycleId,
          subscriptionId: subscription.id,
          accountId,
          openedAt,
          closedAt: null,
          rolloverCredits,
          grantedCredits: plan.monthlyCredits,
          expiredCredits
        };
        ctx.repository.cycleStates.set(accountId, cycleState);
        return cycleState;
      })
    );
}
