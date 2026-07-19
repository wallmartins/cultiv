import { Effect, Option } from "effect";
import {
  BillingGatewayError,
  createSubscriptionId,
  type BillingGatewayAdapter,
  type BillingServiceContract
} from "@my-ai-orchestrator/payments";
import type { PostgresBillingGatewayStore } from "../../infra/postgres-billing-gateway-store.js";

// mirrors billing-lifecycle-service.ts's LIVE_CANCEL_STATUSES (contract-03 §1) — a subscription
// outside these states has nothing live at the gateway to cancel (already canceled/lapsed, or a
// free trial that never had a paid gateway subscription).
const LIVE_CANCEL_STATUSES = new Set(["active", "trialing", "past_due"]);

export interface AccountGatewayCancelDependencies {
  readonly billing: BillingServiceContract;
  readonly gatewayStore: PostgresBillingGatewayStore;
  readonly stripeAdapter?: BillingGatewayAdapter;
  readonly asaasAdapter?: BillingGatewayAdapter;
}

// contract-08 decision 3 — account delete cannot redirect to a portal, so it needs the real
// programmatic cancel (unlike contract-03's user-initiated Stripe-via-Portal path). MUST succeed:
// any failure here (including a lookup failure — never swallowed) aborts the whole delete, so a
// paid gateway subscription can never be orphaned by a purge.
export function cancelActiveGatewaySubscriptionIfAny(
  deps: AccountGatewayCancelDependencies,
  userId: string
): Effect.Effect<void, BillingGatewayError> {
  return Effect.gen(function* () {
    const planId = deps.billing.getPrimarySubscriptionPlanId(userId);
    if (!planId) {
      return;
    }

    const entitlement = deps.billing.getEntitlement(userId, planId);
    if (!entitlement || !LIVE_CANCEL_STATUSES.has(entitlement.status)) {
      return;
    }

    const subscriptionId = createSubscriptionId(userId, planId);
    const gatewaySubOption = yield* deps.gatewayStore.getGatewaySubscription(subscriptionId).pipe(
      Effect.mapError(
        (error) =>
          new BillingGatewayError({
            gateway: "billing",
            message: "Failed to look up gateway subscription before account delete",
            cause: error
          })
      )
    );

    if (Option.isNone(gatewaySubOption)) {
      return;
    }

    const gatewaySub = gatewaySubOption.value;
    const adapter = gatewaySub.gateway === "stripe" ? deps.stripeAdapter : deps.asaasAdapter;
    if (!adapter?.cancelSubscription) {
      return yield* Effect.fail(
        new BillingGatewayError({
          gateway: gatewaySub.gateway,
          message: `cancelSubscription is not configured for gateway ${gatewaySub.gateway}`
        })
      );
    }

    yield* adapter.cancelSubscription(gatewaySub.externalSubscriptionId);
  });
}
