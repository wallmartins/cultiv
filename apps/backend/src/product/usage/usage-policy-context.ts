import type { BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { FeatureFlagRegistry } from "@my-ai-orchestrator/feature-flags";
import type { BackendConfig } from "../../config/config.js";
import { resolveBackendBillingIdentity } from "../../execution/billing.js";
import {
  resolveContentRefinementFlag,
  resolveExecutionModeFlag,
  resolveRolloutFlag
} from "@my-ai-orchestrator/feature-flags";
import type { BackendUsageAuthorizationRequest } from "../core/types.js";

export function resolveUsagePolicyContext(options: {
  readonly billing: BillingServiceContract;
  readonly featureFlagRegistry: FeatureFlagRegistry;
  readonly config: BackendConfig;
  readonly request: BackendUsageAuthorizationRequest;
}) {
  const billingIdentity = resolveBackendBillingIdentity(
    options.request.request,
    options.billing,
    options.config,
    options.request.plan.executionPlan.id
  );
  const entitlement = options.billing.getEntitlement(billingIdentity.userId) ?? null;
  const executionMode = resolveExecutionModeFlag(options.featureFlagRegistry);
  const refinementFlagEnabled = resolveContentRefinementFlag(options.featureFlagRegistry, {
    environment: options.config.environment,
    contentType: options.request.plan.contentType.id,
    userId: billingIdentity.userId
  });
  const betaEnabled = resolveRolloutFlag(options.featureFlagRegistry, "rollout.beta.access", {
    environment: options.config.environment,
    contentType: options.request.plan.contentType.id,
    userId: billingIdentity.userId
  }).enabled;
  const refinementEnabled =
    refinementFlagEnabled && (entitlement === null || entitlement.canRefine);

  return {
    billingIdentity,
    entitlement,
    executionMode,
    refinementEnabled,
    betaEnabled
  } as const;
}
