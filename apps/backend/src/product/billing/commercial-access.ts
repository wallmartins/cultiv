import type { QualityMode } from "@my-ai-orchestrator/contracts";
import type { BillingEntitlement } from "@my-ai-orchestrator/payments";
import { canUseQualityMode, hasActiveBillingSubscription } from "@my-ai-orchestrator/payments";

export type CommercialBlockedReason =
  | "plan_restriction"
  | "subscription_inactive"
  | "quality_mode_plan_restriction"
  | "insufficient_credits";

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

  if (args.currentBalance < args.creditPrice) {
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
