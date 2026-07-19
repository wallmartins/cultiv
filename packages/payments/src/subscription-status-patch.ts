import { createSubscriptionId } from "./subscription-lookup.js";
import type { BillingServiceContract, BillingSubscription } from "./types.js";

// contract-03 §4/Q2 — helper de patch status compartilhado entre o webhook dispatcher (dunning,
// recuperação, cancelamento via portal) e a rota de cancel in-app (ASAAS). Faz merge com a
// assinatura existente em vez de recriar do zero — upsertSubscription substitui a entry inteira.
export function patchSubscriptionStatus(
  billing: BillingServiceContract,
  userId: string,
  planId: string,
  status: BillingSubscription["status"],
  now: () => Date,
  overrides: Partial<Pick<BillingSubscription, "trialEndsAt" | "renewsAt" | "expiresAt" | "everSubscribed">> = {}
): BillingSubscription {
  const existing = billing.getSubscription(userId, planId);
  const next: BillingSubscription = {
    id: createSubscriptionId(userId, planId),
    userId,
    planId,
    status,
    startedAt: existing?.startedAt ?? now().toISOString(),
    trialEndsAt: existing?.trialEndsAt,
    renewsAt: existing?.renewsAt,
    expiresAt: existing?.expiresAt,
    everSubscribed: existing?.everSubscribed,
    ...overrides
  };
  billing.upsertSubscription(next);
  return next;
}

// ponytail: sem billing_period persistido por assinatura (gap conhecido — ver report), o
// accessUntil no cancelamento usa o period-end do gateway como cross-check (Q2) quando
// disponível (Stripe); ASAAS mensal (único cancelável) cai num fallback de +30d.
export function resolveAccessUntilOnCancel(periodEndsAt: string | undefined, now: Date): string {
  if (periodEndsAt) {
    return periodEndsAt;
  }
  const fallback = new Date(now);
  fallback.setUTCDate(fallback.getUTCDate() + 30);
  return fallback.toISOString();
}
