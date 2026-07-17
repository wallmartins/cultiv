import { Effect, Option } from "effect";
import {
  BillingEntitlementNotFoundError,
  BillingGatewayError,
  createSubscriptionId,
  patchSubscriptionStatus,
  resolveAccessUntilOnCancel,
  type BillingEntitlement,
  type BillingGatewayAdapter,
  type BillingServiceContract
} from "@my-ai-orchestrator/payments";
import {
  BackendBillingCheckoutIntentNotFoundError,
  BackendBillingManagementActionNotAllowedError
} from "../../http/errors.js";
import type {
  BillingGatewaySubscription,
  PostgresBillingGatewayStore
} from "../../infra/postgres-billing-gateway-store.js";

export interface BillingPortalSessionResult {
  readonly url: string;
}

export type CheckoutStatus = "pending" | "success" | "failed";

export interface BillingCheckoutStatusResult {
  readonly status: CheckoutStatus;
  readonly planId?: string;
  readonly paymentMethod?: "card" | "pix";
}

export interface BillingLifecycleService {
  readonly createPortalSession: (
    userId: string,
    returnUrl: string
  ) => Effect.Effect<
    BillingPortalSessionResult,
    BillingGatewayError | BackendBillingManagementActionNotAllowedError
  >;
  readonly cancelSubscription: (
    userId: string
  ) => Effect.Effect<
    BillingEntitlement,
    | BillingGatewayError
    | BillingEntitlementNotFoundError
    | BackendBillingManagementActionNotAllowedError
  >;
  readonly getCheckoutStatus: (
    userId: string,
    intentId: string
  ) => Effect.Effect<BillingCheckoutStatusResult, BackendBillingCheckoutIntentNotFoundError>;
}

// N2 — checkout ainda "pending" além desta janela é honesto tratar como "failed" na leitura
// (PIX/boleto abandonado, ou sessão nunca concluída); espelha o mesmo lazy clock do §4.
const CHECKOUT_INTENT_EXPIRY_MS = 30 * 60 * 1000;

function deriveCheckoutStatus(
  intentStatus: string,
  createdAt: string,
  now: Date
): CheckoutStatus {
  if (intentStatus === "completed") {
    return "success";
  }
  if (intentStatus === "failed") {
    return "failed";
  }
  const ageMs = now.getTime() - new Date(createdAt).getTime();
  return ageMs > CHECKOUT_INTENT_EXPIRY_MS ? "failed" : "pending";
}

export function createBillingLifecycleService(deps: {
  readonly billing: BillingServiceContract;
  readonly gatewayStore: PostgresBillingGatewayStore;
  readonly stripeAdapter?: BillingGatewayAdapter;
  readonly asaasAdapter?: BillingGatewayAdapter;
  readonly now: () => Date;
}): BillingLifecycleService {
  const mapStoreError = <A>(effect: Effect.Effect<A, Error>) =>
    effect.pipe(
      Effect.mapError(
        (error) => new BillingGatewayError({ gateway: "billing", message: error.message, cause: error })
      )
    );

  return {
    createPortalSession: (userId, returnUrl) =>
      Effect.gen(function* () {
        if (!deps.stripeAdapter?.createPortalSession) {
          return yield* Effect.fail(
            new BillingGatewayError({ gateway: "stripe", message: "portal session is not configured" })
          );
        }

        const customerOption = yield* mapStoreError(deps.gatewayStore.getGatewayCustomer(userId, "stripe"));
        if (Option.isNone(customerOption)) {
          return yield* Effect.fail(
            new BackendBillingManagementActionNotAllowedError({
              userId,
              action: "portal-session",
              reason: "user has no Stripe customer"
            })
          );
        }

        return yield* deps.stripeAdapter.createPortalSession({
          externalCustomerId: customerOption.value.externalCustomerId,
          returnUrl
        });
      }),

    cancelSubscription: (userId) =>
      Effect.gen(function* () {
        const planId = deps.billing.getPrimarySubscriptionPlanId(userId);
        const entitlement = planId ? deps.billing.getEntitlement(userId, planId) : undefined;
        if (!planId || !entitlement) {
          return yield* Effect.fail(new BillingEntitlementNotFoundError({ userId, planId: planId ?? "" }));
        }

        // idempotente — já cancelado (fora do ciclo pago inclusive) é no-op, retorna a view atual.
        if (entitlement.status === "canceled" || entitlement.status === "lapsed") {
          return entitlement;
        }

        const subscriptionId = createSubscriptionId(userId, planId);
        const gatewaySubOption = yield* mapStoreError(deps.gatewayStore.getGatewaySubscription(subscriptionId));
        const gatewaySub: BillingGatewaySubscription | undefined = Option.isSome(gatewaySubOption)
          ? gatewaySubOption.value
          : undefined;

        if (!gatewaySub || gatewaySub.gateway !== "asaas" || !deps.asaasAdapter?.cancelSubscription) {
          return yield* Effect.fail(
            new BackendBillingManagementActionNotAllowedError({
              userId,
              action: "cancel",
              reason: "in-app cancel is only available for ASAAS monthly subscriptions"
            })
          );
        }

        yield* deps.asaasAdapter.cancelSubscription(gatewaySub.externalSubscriptionId);

        patchSubscriptionStatus(deps.billing, userId, planId, "canceled", deps.now, {
          expiresAt: resolveAccessUntilOnCancel(undefined, deps.now())
        });

        const updated = deps.billing.getEntitlement(userId, planId);
        if (!updated) {
          return yield* Effect.fail(new BillingEntitlementNotFoundError({ userId, planId }));
        }
        return updated;
      }),

    getCheckoutStatus: (userId, intentId) =>
      Effect.gen(function* () {
        const intentOption = yield* deps.gatewayStore.getCheckoutIntent(intentId).pipe(
          Effect.orElseSucceed(() => Option.none())
        );
        if (Option.isNone(intentOption) || intentOption.value.userId !== userId) {
          return yield* Effect.fail(new BackendBillingCheckoutIntentNotFoundError({ userId, intentId }));
        }

        const intent = intentOption.value;
        // ponytail: paymentMethod só fica disponível pós-webhook (gateway subscription row);
        // "pending" antes disso fica sem o campo — capturar no create-intent é follow-up.
        const gatewaySubOption = yield* deps.gatewayStore
          .getGatewaySubscription(createSubscriptionId(userId, intent.internalRef))
          .pipe(Effect.orElseSucceed(() => Option.none()));

        return {
          status: deriveCheckoutStatus(intent.status, intent.createdAt, deps.now()),
          planId: intent.internalRef,
          ...(Option.isSome(gatewaySubOption) && gatewaySubOption.value.paymentMethodKind
            ? { paymentMethod: gatewaySubOption.value.paymentMethodKind as "card" | "pix" }
            : {})
        };
      })
  };
}
