import type { QualityMode } from "@my-ai-orchestrator/contracts";
import type { BillingEntitlement } from "@my-ai-orchestrator/payments";
import { canUseQualityMode, hasActiveBillingSubscription } from "@my-ai-orchestrator/payments";

export type CommercialBlockedReason =
  | "plan_restriction"
  | "subscription_inactive"
  | "quality_mode_plan_restriction"
  | "insufficient_credits";

// One affordability definition for the whole backend: preview gating (below) and the
// generation authorization path both go through this, off the wallet's available credits.
export function canAfford(availableCredits: number, creditPrice: number): boolean {
  return !(availableCredits < creditPrice);
}

export function resolveQualityModeBlockedReason(args: {
  readonly entitlement: BillingEntitlement | null;
  readonly qualityMode: QualityMode;
  readonly creditPrice: number;
  readonly currentBalance: number;
}): CommercialBlockedReason | undefined {
  if (!args.entitlement) {
    return "plan_restriction";
  }

  if (!hasActiveBillingSubscription(args.entitlement)) {
    return "subscription_inactive";
  }

  if (!canUseQualityMode(args.entitlement, args.qualityMode)) {
    return "quality_mode_plan_restriction";
  }

  if (!canAfford(args.currentBalance, args.creditPrice)) {
    return "insufficient_credits";
  }

  return undefined;
}

export function isQualityModeAllowed(args: {
  readonly entitlement: BillingEntitlement | null;
  readonly qualityMode: QualityMode;
  readonly creditPrice: number;
  readonly currentBalance: number;
}): boolean {
  return resolveQualityModeBlockedReason(args) === undefined;
}
