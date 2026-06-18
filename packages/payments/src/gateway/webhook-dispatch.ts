import { Effect } from "effect";
import {
  BillingEntitlementNotFoundError,
  BillingGatewayError,
  BillingOperationConflictError,
  BillingPlanNotFoundError,
  BillingTopUpPackageNotFoundError
} from "../errors.js";
import type { BillingServiceContract } from "../index.js";
import type { GatewayWebhookEvent } from "./types.js";

export interface DispatchGatewayWebhookOptions {
  readonly now: () => Date;
  readonly idempotencyNamespace: string;
}

function createSubscriptionId(userId: string, planId: string): string {
  return `${userId}:${planId}:subscription`;
}

export function dispatchGatewayWebhookEvent(
  billing: BillingServiceContract,
  event: GatewayWebhookEvent,
  options: DispatchGatewayWebhookOptions
): Effect.Effect<
  void,
  | BillingPlanNotFoundError
  | BillingEntitlementNotFoundError
  | BillingOperationConflictError
  | BillingTopUpPackageNotFoundError
  | BillingGatewayError
> {
  return Effect.gen(function* () {
    const planId = event.internalRef ?? "pro";
    const idempotencyKey = `gateway:${event.gateway}:event:${event.eventId}`;

    switch (event.type) {
      case "checkout.completed": {
        if (event.productKind === "topup") {
          const packageId = event.internalRef;
          if (!packageId) {
            return;
          }
          const planId = billing.getPrimarySubscriptionPlanId(event.userId) ?? "pro";
          yield* billing.purchaseTopUp({
            userId: event.userId,
            planId,
            packageId,
            idempotencyKey,
            skipGatewayCharge: true,
            chargeRequest: {
              userId: event.userId,
              subscriptionId: createSubscriptionId(event.userId, planId),
              amount: event.amount,
              currency: event.currency,
              metadata: { gatewayEventId: event.eventId }
            }
          });
          return;
        }
        const plan = billing.listPlans().find((candidate) => candidate.id === planId);
        if (!plan) {
          return yield* Effect.fail(new BillingPlanNotFoundError({ planId }));
        }

        billing.upsertSubscription({
          id: createSubscriptionId(event.userId, planId),
          userId: event.userId,
          planId,
          status: "active",
          startedAt: options.now().toISOString()
        });

        const entitlementBefore = billing.getEntitlement(event.userId, planId);
        if (entitlementBefore?.activeCycleId == null) {
          yield* billing.startCycle({
            userId: event.userId,
            planId,
            cycleId: `${event.userId}:${planId}:cycle:${event.eventId}`,
            idempotencyKey
          });
        }
        return;
      }
      case "subscription.renewed":
        yield* billing.startCycle({
          userId: event.userId,
          planId,
          cycleId: `${event.userId}:${planId}:cycle:${event.eventId}`,
          idempotencyKey
        });
        return;
      case "subscription.cancelled":
        billing.upsertSubscription({
          id: createSubscriptionId(event.userId, planId),
          userId: event.userId,
          planId,
          status: "canceled",
          startedAt: options.now().toISOString()
        });
        return;
      case "chargeback":
        billing.upsertSubscription({
          id: createSubscriptionId(event.userId, planId),
          userId: event.userId,
          planId,
          status: "past_due",
          startedAt: options.now().toISOString()
        });
        return;
      case "payment.failed":
        return;
    }
  });
}
