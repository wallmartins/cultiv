import type { BillingEntitlement } from "@my-ai-orchestrator/payments";
import { hasActiveBillingSubscription } from "@my-ai-orchestrator/payments";
import { Effect } from "effect";
import { BackendUsageAuthorizationError } from "../../http/errors.js";

export function enforceUsagePolicyGuards(args: {
  readonly userId: string;
  readonly planId: string;
  readonly requestedExecutionMode: "sync" | "async";
  readonly resolvedExecutionMode: "sync" | "async";
  readonly entitlement: BillingEntitlement | null;
  readonly model: string;
  readonly allowedModel: boolean;
}): Effect.Effect<void, BackendUsageAuthorizationError> {
  if (args.requestedExecutionMode === "sync" && args.resolvedExecutionMode === "async") {
    return Effect.fail(
      new BackendUsageAuthorizationError({
        userId: args.userId,
        planId: args.planId,
        reason: "feature_disabled",
        message: "Sync execution is disabled by feature flags"
      })
    );
  }

  // Live access includes trialing/past_due/in-window-canceled — mirror the same
  // definition Gate A uses (assertPublicGenerationAccess), not a literal "active".
  if (args.entitlement && !hasActiveBillingSubscription(args.entitlement)) {
    return Effect.fail(
      new BackendUsageAuthorizationError({
        userId: args.userId,
        planId: args.planId,
        reason: "plan_inactive",
        message: `Plan "${args.planId}" is not active`
      })
    );
  }

  if (args.entitlement && args.entitlement.allowedModels.length > 0 && !args.allowedModel) {
    return Effect.fail(
      new BackendUsageAuthorizationError({
        userId: args.userId,
        planId: args.planId,
        reason: "model_not_allowed",
        message: `Model "${args.model}" is not allowed for plan "${args.planId}"`
      })
    );
  }

  return Effect.void;
}
