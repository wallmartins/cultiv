import { Effect } from "effect";
import {
  BillingEntitlementNotFoundError,
  ensureDefaultFreeSubscription,
  type BillingActivationOptions,
  type BillingEntitlement,
  type BillingOperationConflictError,
  type BillingPlanNotFoundError,
  type BillingServiceContract
} from "@my-ai-orchestrator/payments";
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

export function ensureUserEntitlement(
  billing: BillingServiceContract,
  userId: string,
  options: BillingActivationOptions
): Effect.Effect<
  BillingEntitlement,
  BillingPlanNotFoundError | BillingEntitlementNotFoundError | BillingOperationConflictError
> {
  return Effect.gen(function* () {
    const planId = resolveStoredUserPlanId(billing, userId);
    const existing = billing.getEntitlement(userId, planId);
    if (existing) {
      return existing;
    }

    const ensured = yield* ensureDefaultFreeSubscription(billing, userId, options);
    if (ensured) {
      return ensured;
    }

    const resolvedPlanId = resolveStoredUserPlanId(billing, userId);
    const entitlement = billing.getEntitlement(userId, resolvedPlanId);
    if (entitlement) {
      return entitlement;
    }

    return yield* Effect.fail(
      new BillingEntitlementNotFoundError({
        userId,
        planId: resolvedPlanId
      })
    );
  });
}
