import type { BillingWallet } from "@my-ai-orchestrator/contracts";
import { createAccountId, hasFeature, isSameUtcDay } from "./billing-utils.js";
import type {
  BillingEntitlement,
  BillingPlanDefinition,
  BillingSubscription,
  BillingUsageRecord
} from "./types.js";

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

  return {
    userId: subscription.userId,
    planId: plan.id,
    tier: plan.tier,
    status: subscription.status,
    monthlyCreditsRemaining: wallet.availableCredits,
    dailyCreditsRemaining: plan.dailyCredits === undefined ? null : Math.max(0, plan.dailyCredits - dailyConsumed),
    canGenerate: subscription.status === "active" && wallet.availableCredits > 0,
    canRefine: subscription.status === "active" && hasFeature(plan, "content.language.refinement"),
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
