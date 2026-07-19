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

      // dedup só é gravado DEPOIS que o dispatch + os side-effects terminam com sucesso —
      // se recordGatewayEvent rodasse antes e o dispatch falhasse, o retry do gateway bateria
      // em isNew=false e desistiria, perdendo o evento pra sempre mesmo o cliente tendo pago.
      // Toda operação abaixo é idempotente (idempotencyKey no startCycle, upsert no
      // patchSubscriptionStatus/completeCheckoutIntent/upsertGateway*), então reprocessar um
      // retry legítimo do mesmo evento é seguro.
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
        // sem fallback a um plano-default aqui — se não dá pra resolver, não adivinha; dispatch
        // (acima) já resolveu/validou o mesmo planId p/ eventos de assinatura, então isto só
        // fica indefinido em casos que dispatch já teria rejeitado antes de chegar aqui.
        const planId = resolvedEvent.internalRef ?? deps.billing.getPrimarySubscriptionPlanId(resolvedEvent.userId);
        if (planId) {
          yield* deps.gatewayStore.upsertGatewaySubscription({
            subscriptionId: createSubscriptionId(resolvedEvent.userId, planId),
            gateway: resolvedEvent.gateway,
            externalSubscriptionId: resolvedEvent.externalSubscriptionId,
            status: resolveGatewaySubscriptionStatus(resolvedEvent.type),
            currency: resolvedEvent.currency,
            updatedAt: deps.now().toISOString(),
            ...(resolvedEvent.paymentMethodKind ? { paymentMethodKind: resolvedEvent.paymentMethodKind } : {}),
            ...(resolvedEvent.outstandingInvoiceUrl
              ? { outstandingInvoiceUrl: resolvedEvent.outstandingInvoiceUrl }
              : {})
          });
        }
      }

      yield* deps.gatewayStore.recordGatewayEvent({
        eventId: resolvedEvent.eventId,
        gateway: resolvedEvent.gateway,
        eventType: resolvedEvent.type,
        processedAt: deps.now().toISOString(),
        payloadHash: hashPayload(payload)
      });
    });

  return {
    handleStripeWebhook: (rawBody, signature) => handleWebhook(deps.stripeAdapter, rawBody, signature),
    handleAsaasWebhook: (rawBody, token) => handleWebhook(deps.asaasAdapter, rawBody, token)
  };
}

function resolveGatewaySubscriptionStatus(type: GatewayWebhookEvent["type"]): string {
  switch (type) {
    case "subscription.cancelled":
      return "canceled";
    case "payment.failed":
    case "chargeback":
      return "past_due";
    default:
      return "active";
  }
}

function hashPayload(payload: unknown): string {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
  return createHash("sha256").update(raw).digest("hex");
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
