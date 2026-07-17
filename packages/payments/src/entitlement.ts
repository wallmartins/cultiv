import type { BillingGenerationGate, BillingWallet } from "@my-ai-orchestrator/contracts";
import { createAccountId, hasFeature, isSameUtcDay } from "./billing-utils.js";
import type {
  BillingEntitlement,
  BillingPlanDefinition,
  BillingSubscription,
  BillingUsageRecord
} from "./types.js";

export interface EntitlementGateInputs {
  readonly status: BillingSubscription["status"];
  readonly availableCredits: number;
  readonly now: Date;
  readonly trialEndsAt?: string;
  readonly accessUntil?: string;
  readonly everSubscribed?: boolean;
}

export interface EntitlementGate {
  readonly hasLiveAccess: boolean;
  readonly canGenerate: boolean;
  readonly gate: BillingGenerationGate;
}

function isBeforeDeadline(deadline: string | undefined, now: Date): boolean {
  return deadline === undefined || now.getTime() < new Date(deadline).getTime();
}

function resolveLapsedGate(everSubscribed: boolean | undefined): BillingGenerationGate {
  return everSubscribed ? "lapsed" : "trial_expired";
}

export interface EffectiveStatusInputs {
  readonly status: BillingSubscription["status"];
  readonly availableCredits: number;
  readonly now: Date;
  readonly trialEndsAt?: string;
  readonly accessUntil?: string;
}

// contract-03 §4 — lazy clock: deriva o status efetivo na leitura (sem scheduler); um sweeper
// periódico materializa a mesma transição na coluna (ver sweeper job).
export function deriveEffectiveSubscriptionStatus(
  input: EffectiveStatusInputs
): BillingSubscription["status"] {
  if (
    input.status === "trialing" &&
    (!isBeforeDeadline(input.trialEndsAt, input.now) || input.availableCredits <= 0)
  ) {
    return "lapsed";
  }

  if (input.status === "canceled" && !isBeforeDeadline(input.accessUntil, input.now)) {
    return "lapsed";
  }

  return input.status;
}

// Materializa ADR 0006 §2/§5: acesso vivo = active | trial dentro do prazo | past_due (dunning, créditos seguem) | canceled dentro do ciclo pago.
export function computeEntitlementGate(input: EntitlementGateInputs): EntitlementGate {
  const hasLiveAccess =
    input.status === "active" ||
    (input.status === "trialing" && isBeforeDeadline(input.trialEndsAt, input.now)) ||
    input.status === "past_due" ||
    (input.status === "canceled" && isBeforeDeadline(input.accessUntil, input.now));

  const canGenerate = hasLiveAccess && input.availableCredits > 0;

  const gate: BillingGenerationGate = canGenerate
    ? "ok"
    : input.status === "lapsed"
      ? resolveLapsedGate(input.everSubscribed)
      : input.status === "past_due"
        ? "past_due"
        : hasLiveAccess
          ? "no_credits"
          : resolveLapsedGate(input.everSubscribed);

  return { hasLiveAccess, canGenerate, gate };
}

export function createBillingEntitlement(
  plan: BillingPlanDefinition,
  subscription: BillingSubscription,
  usage: readonly BillingUsageRecord[] = [],
  referenceDate: Date = new Date()
): BillingEntitlement {
  const consumed = usage
    .filter((entry) => entry.planId === plan.id && entry.userId === subscription.userId)
    .reduce((total, entry) => total + entry.credits, 0);
  const dailyConsumed = usage
    .filter(
      (entry) =>
        entry.planId === plan.id &&
        entry.userId === subscription.userId &&
        isSameUtcDay(entry.createdAt, referenceDate)
    )
    .reduce((total, entry) => total + entry.credits, 0);

  const wallet: BillingWallet = {
    accountId: createAccountId(subscription.userId, plan.id),
    subscriptionId: subscription.id,
    activeCycleId: null,
    availableCredits: Math.max(0, plan.monthlyCredits - consumed),
    reservedCredits: 0,
    pendingCredits: 0,
    lifetimeGrantedCredits: plan.monthlyCredits,
    lifetimeDebitedCredits: consumed
  };

  const effectiveStatus = deriveEffectiveSubscriptionStatus({
    status: subscription.status,
    availableCredits: wallet.availableCredits,
    now: referenceDate,
    trialEndsAt: subscription.trialEndsAt,
    accessUntil: subscription.expiresAt
  });

  const { hasLiveAccess, canGenerate, gate } = computeEntitlementGate({
    status: effectiveStatus,
    availableCredits: wallet.availableCredits,
    now: referenceDate,
    trialEndsAt: subscription.trialEndsAt,
    accessUntil: subscription.expiresAt,
    everSubscribed: subscription.everSubscribed
  });

  return {
    userId: subscription.userId,
    planId: plan.id,
    tier: plan.tier,
    status: effectiveStatus,
    monthlyCreditsRemaining: wallet.availableCredits,
    dailyCreditsRemaining: plan.dailyCredits === undefined ? null : Math.max(0, plan.dailyCredits - dailyConsumed),
    canGenerate,
    canRefine: hasLiveAccess && hasFeature(plan, "content.language.refinement"),
    gate,
    trialEndsAt: subscription.trialEndsAt,
    renewsAt: subscription.renewsAt,
    accessUntil: subscription.expiresAt,
    everSubscribed: subscription.everSubscribed,
    paymentMethod: null, // ponytail: payments package has no gateway knowledge; backend route fills this from PostgresBillingGatewayStore
    allowedModels: plan.allowedModels ?? [],
    features: Object.fromEntries(plan.features.map((feature) => [feature.key, feature.enabled])),
    wallet,
    activeCycleId: null
  };
}

export function listBillingFeatures(entitlement: BillingEntitlement): string[] {
  return Object.entries(entitlement.features)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);
}
