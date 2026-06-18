import { createHash } from "node:crypto";
import { Effect, Option } from "effect";
import {
  BillingGatewayWebhookVerificationError,
  createSubscriptionId,
  dispatchGatewayWebhookEvent,
  type BillingGatewayAdapter,
  type BillingProductKind,
  type BillingServiceContract,
  type GatewayWebhookEvent
} from "@my-ai-orchestrator/payments";
import type { BackendConfig } from "../../config/config.js";
import type { PostgresBillingGatewayStore } from "../../infra/postgres-billing-gateway-store.js";

export interface BillingWebhookService {
  readonly handleStripeWebhook: (rawBody: string, signature: string) => Effect.Effect<void, Error>;
  readonly handleAsaasWebhook: (rawBody: string, token: string) => Effect.Effect<void, Error>;
}

export function createBillingWebhookService(deps: {
  readonly billing: BillingServiceContract;
  readonly gatewayStore: PostgresBillingGatewayStore;
  readonly stripeAdapter?: BillingGatewayAdapter;
  readonly asaasAdapter?: BillingGatewayAdapter;
  readonly config: BackendConfig;
  readonly now: () => Date;
}): BillingWebhookService {
  const handleWebhook = (
    adapter: BillingGatewayAdapter | undefined,
    payload: unknown,
    signature: string
  ) =>
    Effect.gen(function* () {
      if (!adapter?.parseWebhook) {
        return yield* Effect.fail(
          new BillingGatewayWebhookVerificationError({
            gateway: adapter?.name ?? "unknown",
            message: "webhook adapter is not configured"
          })
        );
      }

      const event = yield* adapter.parseWebhook(payload, signature);
      const resolvedEvent = yield* resolveWebhookEvent(deps.gatewayStore, event);
      const isNew = yield* deps.gatewayStore.recordGatewayEvent({
        eventId: resolvedEvent.eventId,
        gateway: resolvedEvent.gateway,
        eventType: resolvedEvent.type,
        processedAt: deps.now().toISOString(),
        payloadHash: hashPayload(payload)
      });
      if (!isNew) {
        return;
      }

      yield* dispatchGatewayWebhookEvent(deps.billing, resolvedEvent, {
        now: deps.now,
        idempotencyNamespace: deps.config.serviceName
      });

      if (resolvedEvent.checkoutIntentId) {
        yield* deps.gatewayStore.completeCheckoutIntent(
          resolvedEvent.checkoutIntentId,
          deps.now().toISOString()
        );
      }

      if (resolvedEvent.externalCustomerId) {
        yield* deps.gatewayStore.upsertGatewayCustomer({
          userId: resolvedEvent.userId,
          gateway: resolvedEvent.gateway,
          externalCustomerId: resolvedEvent.externalCustomerId,
          createdAt: deps.now().toISOString()
        });
      }

      if (resolvedEvent.externalSubscriptionId) {
        const planId =
          resolvedEvent.internalRef ?? deps.billing.getPrimarySubscriptionPlanId(resolvedEvent.userId) ?? "pro";
        yield* deps.gatewayStore.upsertGatewaySubscription({
          subscriptionId: createSubscriptionId(resolvedEvent.userId, planId),
          gateway: resolvedEvent.gateway,
          externalSubscriptionId: resolvedEvent.externalSubscriptionId,
          status: resolvedEvent.type === "subscription.cancelled" ? "canceled" : "active",
          currency: resolvedEvent.currency,
          updatedAt: deps.now().toISOString()
        });
      }
    });

  return {
    handleStripeWebhook: (rawBody, signature) =>
      handleWebhook(deps.stripeAdapter, rawBody, signature).pipe(Effect.mapError(toError)),
    handleAsaasWebhook: (rawBody, token) =>
      handleWebhook(deps.asaasAdapter, rawBody, token).pipe(Effect.mapError(toError))
  };
}

function hashPayload(payload: unknown): string {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
  return createHash("sha256").update(raw).digest("hex");
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function resolveWebhookEvent(
  gatewayStore: PostgresBillingGatewayStore,
  event: GatewayWebhookEvent
): Effect.Effect<GatewayWebhookEvent, Error> {
  if (!event.checkoutIntentId) {
    return Effect.succeed(event);
  }

  return Effect.gen(function* () {
    const intentOption = yield* gatewayStore.getCheckoutIntent(event.checkoutIntentId!);
    if (Option.isNone(intentOption)) {
      return event;
    }
    const intent = intentOption.value;
    return {
      ...event,
      userId: event.userId === "unknown" ? intent.userId : event.userId,
      internalRef: event.internalRef ?? intent.internalRef,
      productKind: event.productKind ?? (intent.productKind as BillingProductKind)
    };
  });
}
