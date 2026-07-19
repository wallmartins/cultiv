import { Effect, Either, Schema } from "effect";
import { resolveExecutionSnapshot as composeExecutionSnapshot } from "./ai-policy-snapshot.js";
import { readCompositorMetadata } from "../../execution/pipeline-metadata.js";
import {
  resolvePolicyPricingEnvelope,
  resolvePolicyVersion,
  type ResolvedPolicyVersionIndex
} from "./ai-policy-version-index.js";
import type {
  BillingPlanTier,
  ExecutionEntryInput,
  ResolvedExecutionSnapshot,
  ResolvedPricingEnvelope
} from "./ai-policy-types.js";
import type {
  GenerationLengthTier,
  PlanSignature,
  PipelineRequest
} from "@my-ai-orchestrator/contracts";
import { PlanSignatureSchema, GenerationLengthTierSchema } from "@my-ai-orchestrator/contracts";

export function resolvePolicyPricing(args: {
  readonly index: ResolvedPolicyVersionIndex;
  readonly policyVersion: string;
  readonly planTier: BillingPlanTier;
  readonly contentType: string;
  readonly qualityMode: import("@my-ai-orchestrator/contracts").QualityMode;
  readonly planSignature?: PlanSignature;
  readonly lengthTier?: GenerationLengthTier;
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
      qualityMode: args.qualityMode,
      planSignature: args.planSignature,
      lengthTier: args.lengthTier
    });
  });
}

export function resolvePolicyExecutionSnapshot(args: {
  readonly index: ResolvedPolicyVersionIndex;
  readonly policyVersion: string;
  readonly request: ExecutionEntryInput;
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
    const compositorPricing = resolveCompositorPricingKeys(args.request);
    const resolvedQualityMode = args.request.qualityMode ?? args.qualityMode;
    const policy = yield* resolvePolicyVersion(args.index, args.policyVersion, {
      planTier: args.planTier,
      contentType,
      qualityMode: resolvedQualityMode
    });
    const pricingEnvelope = yield* resolvePolicyPricingEnvelope(args.index, policy, {
      planTier: args.planTier,
      contentType,
      qualityMode: resolvedQualityMode,
      planSignature: compositorPricing.planSignature,
      lengthTier: compositorPricing.lengthTier
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

export function resolveCompositorPricingKeys(request: PipelineRequest): {
  readonly planSignature?: PlanSignature;
  readonly lengthTier?: GenerationLengthTier;
} {
  const compositor = extractCompositorMetadata(request);
  if (!compositor?.planSignature || !compositor.lengthTier) {
    return {};
  }

  return {
    planSignature: decodePlanSignature(compositor.planSignature),
    lengthTier: decodeLengthTier(compositor.lengthTier)
  };
}

function extractCompositorMetadata(
  request: PipelineRequest
): { readonly planSignature?: string; readonly lengthTier?: string } | undefined {
  const compositor = readCompositorMetadata("context" in request ? request.context : undefined);
  if (!compositor) {
    return undefined;
  }

  return {
    planSignature: typeof compositor.planSignature === "string" ? compositor.planSignature : undefined,
    lengthTier: typeof compositor.lengthTier === "string" ? compositor.lengthTier : undefined
  };
}

function decodePlanSignature(value: string): PlanSignature | undefined {
  const result = Schema.decodeUnknownEither(PlanSignatureSchema)(value);
  return Either.isRight(result) ? result.right : undefined;
}

function decodeLengthTier(value: string): GenerationLengthTier | undefined {
  const result = Schema.decodeUnknownEither(GenerationLengthTierSchema)(value);
  return Either.isRight(result) ? result.right : undefined;
}
