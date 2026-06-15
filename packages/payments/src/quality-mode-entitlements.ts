import type { QualityMode } from "@my-ai-orchestrator/contracts";

export type BillingPlanTier = "free" | "starter" | "pro" | "enterprise";
export type BillingPlanStatus = "active" | "trialing" | "past_due" | "canceled";

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

export function hasActiveBillingSubscription(entitlement: QualityModeEntitlement): boolean {
  return entitlement.status === "active";
}

export function canUseQualityMode(entitlement: QualityModeEntitlement, mode: QualityMode): boolean {
  if (!hasActiveBillingSubscription(entitlement)) {
    return false;
  }

  return resolveAllowedQualityModes(entitlement.tier).includes(mode);
}
