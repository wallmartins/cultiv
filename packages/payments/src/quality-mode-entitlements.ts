import type { QualityMode } from "@my-ai-orchestrator/contracts";

export type BillingPlanTier = "free" | "starter" | "pro" | "enterprise";
export type BillingPlanStatus = "active" | "trialing" | "past_due" | "canceled" | "lapsed";

export interface QualityModeEntitlement {
  readonly tier: BillingPlanTier;
  readonly status: BillingPlanStatus;
}

const MODES_BY_TIER: Record<BillingPlanTier, readonly QualityMode[]> = {
  free: ["fast"],
  starter: ["fast", "balanced"],
  pro: ["fast", "balanced", "strict"],
  enterprise: ["fast", "balanced", "strict"]
};

export function resolveAllowedQualityModes(tier: BillingPlanTier): readonly QualityMode[] {
  return MODES_BY_TIER[tier];
}

export function resolveMinimumPlanTierForQualityMode(mode: QualityMode): BillingPlanTier {
  if (mode === "fast") {
    return "free";
  }

  if (mode === "balanced") {
    return "starter";
  }

  return "pro";
}

// contract-03 — espelha o hasLiveAccess do gate (entitlement.ts): status "trialing"/"canceled"
// aqui já chega efetivo (pós lazy clock, ver deriveEffectiveSubscriptionStatus), então "trialing"
// e "canceled" nunca aparecem além da janela/ciclo pago — só "lapsed" representaria isso.
const LIVE_ACCESS_STATUSES: readonly BillingPlanStatus[] = ["active", "trialing", "past_due", "canceled"];

export function hasActiveBillingSubscription(entitlement: QualityModeEntitlement): boolean {
  return LIVE_ACCESS_STATUSES.includes(entitlement.status);
}

export function canUseQualityMode(entitlement: QualityModeEntitlement, mode: QualityMode): boolean {
  if (!hasActiveBillingSubscription(entitlement)) {
    return false;
  }

  return resolveAllowedQualityModes(entitlement.tier).includes(mode);
}
