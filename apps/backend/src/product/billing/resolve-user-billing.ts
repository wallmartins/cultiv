import type { BillingEntitlement, BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { BillingPlanTier } from "../ai-policy/ai-policy-types.js";

export function resolveStoredUserEntitlement(
  billing: BillingServiceContract,
  userId: string
): BillingEntitlement | undefined {
  return billing.getEntitlement(userId);
}

export function resolveStoredUserPlanId(billing: BillingServiceContract, userId: string): string {
  return billing.getPrimarySubscriptionPlanId(userId) ?? billing.getEntitlement(userId)?.planId ?? "free";
}

export function resolveStoredUserPlanTier(
  billing: BillingServiceContract,
  userId: string
): BillingPlanTier {
  return (resolveStoredUserEntitlement(billing, userId)?.tier ?? "free") as BillingPlanTier;
}
