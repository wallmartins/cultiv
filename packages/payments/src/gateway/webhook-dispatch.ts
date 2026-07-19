import { Effect } from "effect";
import {
  BillingEntitlementNotFoundError,
  BillingGatewayError,
  BillingOperationConflictError,
  BillingPlanNotFoundError,
  BillingTopUpPackageNotFoundError
} from "../errors.js";
import { DEFAULT_TRIAL_PLAN_ID } from "../activation.js";
import { patchSubscriptionStatus, resolveAccessUntilOnCancel } from "../subscription-status-patch.js";
import { createSubscriptionId } from "../subscription-lookup.js";
import type { BillingServiceContract } from "../types.js";
import type { GatewayWebhookEvent } from "./types.js";

export interface DispatchGatewayWebhookOptions {
  readonly now: () => Date;
  readonly idempotencyNamespace: string;
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
    const idempotencyKey = `gateway:${event.gateway}:event:${event.eventId}`;

    // topup nunca usa planId de assinatura (resolve/valida o seu próprio packageId abaixo, via
    // purchaseTopUp) — extraído antes da guarda p/ nem entrar na resolução/validação de plano.
    if (event.type === "checkout.completed" && event.productKind === "topup") {
      const packageId = event.internalRef;
      if (!packageId) {
        return;
      }
      const planId = billing.getPrimarySubscriptionPlanId(event.userId) ?? DEFAULT_TRIAL_PLAN_ID;
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

    // dunning/cancel events raramente trazem internalRef (não vêm de um checkout intent); cai
    // no plano vigente do usuário quando ausente. Sem NENHUM fallback a um plano real aqui —
    // "trial" é uma assinatura de verdade, então cair nele silenciosamente escaparia da guarda
    // abaixo e fabricaria uma subscription "trial" fantasma (sem trialEndsAt, sem clock de
    // lapso) pra um evento que não deveria ter mexido em nada. Sem sinal -> falha alto.
    const planId = event.internalRef ?? billing.getPrimarySubscriptionPlanId(event.userId);
    if (planId === undefined || !billing.listPlans().some((candidate) => candidate.id === planId)) {
      return yield* Effect.fail(new BillingPlanNotFoundError({ planId: planId ?? "unresolved" }));
    }

    switch (event.type) {
      case "checkout.completed": {
        // productKind "topup" já retornou acima; daqui pra baixo é sempre subscription.
        // contract-03 §4 — checkout.completed de subscription é sempre um plano pago do
        // catálogo (o trial nunca passa por checkout); 1º checkout bem-sucedido = everSubscribed.
        patchSubscriptionStatus(billing, event.userId, planId, "active", options.now, {
          everSubscribed: true
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
        // recuperação de dunning (Stripe invoice.paid / ASAAS PAYMENT_RECEIVED estando
        // past_due) também chega aqui — flipar para "active" é o efeito desejado nos dois casos.
        patchSubscriptionStatus(billing, event.userId, planId, "active", options.now);
        yield* billing.startCycle({
          userId: event.userId,
          planId,
          cycleId: `${event.userId}:${planId}:cycle:${event.eventId}`,
          idempotencyKey
        });
        return;
      case "subscription.cancelled":
        patchSubscriptionStatus(billing, event.userId, planId, "canceled", options.now, {
          expiresAt: resolveAccessUntilOnCancel(event.periodEndsAt, options.now())
        });
        return;
      case "chargeback":
        patchSubscriptionStatus(billing, event.userId, planId, "past_due", options.now);
        return;
      case "payment.failed":
        // dunning: cobrança falhou (Stripe invoice.payment_failed / ASAAS PAYMENT_OVERDUE)
        // — créditos seguem valendo (ADR 0006 §5), só o status muda p/ o gate refletir.
        patchSubscriptionStatus(billing, event.userId, planId, "past_due", options.now);
        return;
      default: {
        const _exhaustive: never = event.type;
        return _exhaustive;
      }
    }
  });
}
