import type { BillingPlanTier } from "@my-ai-orchestrator/payments";

const baseLimitByTier: Record<BillingPlanTier, number | null> = {
  free: 25,
  starter: 100,
  pro: 500,
  enterprise: 5000
};

export function resolveTrafficLimit(tier: BillingPlanTier, betaEnabled: boolean): number | null {
  const baseLimit = baseLimitByTier[tier];
  if (baseLimit === null) {
    return null;
  }

  return betaEnabled ? baseLimit * 2 : baseLimit;
}
