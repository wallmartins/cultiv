import { Effect } from "effect";
import { resolveExecutionSnapshot as composeExecutionSnapshot } from "./ai-policy-snapshot.js";
import {
  resolvePolicyPricingEnvelope,
  resolvePolicyVersion,
  type ResolvedPolicyVersionIndex
} from "./ai-policy-version-index.js";
import type {
  BillingPlanTier,
  ResolvedExecutionSnapshot,
  ResolvedPricingEnvelope
} from "./ai-policy-types.js";

export function resolvePolicyPricing(args: {
  readonly index: ResolvedPolicyVersionIndex;
  readonly policyVersion: string;
  readonly planTier: BillingPlanTier;
  readonly contentType: string;
  readonly qualityMode: import("@my-ai-orchestrator/contracts").QualityMode;
}): Effect.Effect<ResolvedPricingEnvelope, import("../../http/errors.js").BackendAIPolicyPricingError> {
  return Effect.gen(function* () {
    const policy = yield* resolvePolicyVersion(args.index, args.policyVersion, {
      planTier: args.planTier,
      contentType: args.contentType,
      qualityMode: args.qualityMode
    });

    return yield* resolvePolicyPricingEnvelope(args.index, policy, {
      planTier: args.planTier,
      contentType: args.contentType,
      qualityMode: args.qualityMode
    });
  });
}

export function resolvePolicyExecutionSnapshot(args: {
  readonly index: ResolvedPolicyVersionIndex;
  readonly policyVersion: string;
  readonly request: import("@my-ai-orchestrator/contracts").PipelineRequest;
  readonly planTier: BillingPlanTier;
  readonly executionMode: import("@my-ai-orchestrator/contracts").ExecutionMode;
  readonly qualityMode: import("@my-ai-orchestrator/contracts").QualityMode;
  readonly defaultLanguage: string;
}): Effect.Effect<
  ResolvedExecutionSnapshot,
  import("../../http/errors.js").BackendAIPolicyPricingError | import("../../http/errors.js").BackendAIPolicyCatalogError
> {
  return Effect.gen(function* () {
    const contentType = resolveRequestContentType(args.request);
    const resolvedQualityMode = args.request.qualityMode ?? args.qualityMode;
    const policy = yield* resolvePolicyVersion(args.index, args.policyVersion, {
      planTier: args.planTier,
      contentType,
      qualityMode: resolvedQualityMode
    });
    const pricingEnvelope = yield* resolvePolicyPricingEnvelope(args.index, policy, {
      planTier: args.planTier,
      contentType,
      qualityMode: resolvedQualityMode
    });

    return yield* composeExecutionSnapshot({
      policy,
      pricingEnvelope,
      request: args.request,
      planTier: args.planTier,
      executionMode: args.executionMode,
      qualityMode: args.qualityMode,
      defaultLanguage: args.defaultLanguage
    });
  });
}

export function resolveRequestContentType(
  request: import("@my-ai-orchestrator/contracts").PipelineRequest
): string {
  if ("contentType" in request && request.contentType) {
    return request.contentType;
  }

  if ("pipeline" in request) {
    return request.pipeline.name;
  }

  return request.pipelineType;
}
