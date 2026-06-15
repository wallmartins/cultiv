import { Effect } from "effect";
import type { PipelineType } from "@my-ai-orchestrator/contracts";
import { BackendAIPolicyCatalogError, BackendAIPolicyPricingError } from "../../http/errors.js";
import type { ResolvedVersionDocument } from "./ai-policy-loader.js";
import { toResolvedAIPolicyVersion } from "./ai-policy-mappers.js";
import type {
  AIPolicyPipelineDefinition,
  BackendAIPolicyVersionSummary,
  ResolvedAIPolicyVersion
} from "./ai-policy-types.js";

export interface ResolvedPolicyVersionIndex {
  readonly versions: ReadonlyMap<string, ResolvedAIPolicyVersion>;
  readonly pricingDocuments: ReadonlyMap<string, ResolvedVersionDocument>;
  readonly versionSummaries: readonly BackendAIPolicyVersionSummary[];
  readonly policyVersions: readonly ResolvedAIPolicyVersion[];
  readonly fallbackPolicy: ResolvedAIPolicyVersion;
}

export function createResolvedPolicyVersionIndex(args: {
  readonly activePolicy: ResolvedVersionDocument;
  readonly versionIndex: ReadonlyMap<string, ResolvedVersionDocument>;
}): ResolvedPolicyVersionIndex {
  const versions = new Map(
    Array.from(args.versionIndex.entries()).map(([version, document]) => [version, toResolvedAIPolicyVersion(document)] as const)
  );
  const fallbackPolicy = versions.get(args.activePolicy.version) ?? toResolvedAIPolicyVersion(args.activePolicy);
  const policyVersions = Array.from(versions.values());
  const versionSummaries = policyVersions.map((policyVersion) => ({
    version: policyVersion.version,
    lifecycle: policyVersion.lifecycle
  })) satisfies readonly BackendAIPolicyVersionSummary[];

  return {
    versions,
    pricingDocuments: args.versionIndex,
    versionSummaries,
    policyVersions,
    fallbackPolicy
  };
}

export function resolvePolicyVersion(
  index: ResolvedPolicyVersionIndex,
  policyVersion: string,
  context: {
    readonly planTier: string;
    readonly contentType: string;
    readonly qualityMode: string;
  }
): Effect.Effect<ResolvedAIPolicyVersion, BackendAIPolicyPricingError> {
  const policy = index.versions.get(policyVersion);

  if (policy) {
    return Effect.succeed(policy);
  }

  return Effect.fail(
    new BackendAIPolicyPricingError({
      policyVersion,
      planTier: context.planTier,
      contentType: context.contentType,
      qualityMode: context.qualityMode,
      message: `Policy version "${policyVersion}" is not available for pricing resolution`
    })
  );
}

export function resolvePolicyPipeline(
  policy: ResolvedAIPolicyVersion,
  contentType: string
): Effect.Effect<AIPolicyPipelineDefinition, BackendAIPolicyCatalogError> {
  const contentTypeDefinition = policy.contentTypes[contentType];
  if (!contentTypeDefinition) {
    return Effect.fail(
      new BackendAIPolicyCatalogError({
        policyVersion: policy.version,
        pipelineName: contentType,
        message: `Content type "${contentType}" is not present in active AI policy`
      })
    );
  }

  return Effect.succeed(policy.catalog[contentTypeDefinition.pipelineType as PipelineType]);
}

export function resolvePolicyPricingEnvelope(
  index: ResolvedPolicyVersionIndex,
  policy: ResolvedAIPolicyVersion,
  args: {
    readonly planTier: string;
    readonly contentType: string;
    readonly qualityMode: string;
  }
): Effect.Effect<import("./ai-policy-types.js").ResolvedPricingEnvelope, BackendAIPolicyPricingError> {
  const matchingPrice = index.pricingDocuments
    .get(policy.version)
    ?.pricing.pricing.find(
      (price) =>
        price.planTier === args.planTier &&
        price.contentType === args.contentType &&
        price.qualityMode === args.qualityMode
    );

  if (!matchingPrice) {
    return Effect.fail(
      new BackendAIPolicyPricingError({
        policyVersion: policy.version,
        planTier: args.planTier,
        contentType: args.contentType,
        qualityMode: args.qualityMode,
        message: `No pricing envelope found for ${args.planTier}/${args.contentType}/${args.qualityMode}`
      })
    );
  }

  return Effect.succeed({
    policyVersion: policy.version,
    lifecycle: policy.lifecycle,
    planTier: args.planTier as import("./ai-policy-types.js").ResolvedPricingEnvelope["planTier"],
    contentType: args.contentType,
    qualityMode: args.qualityMode as import("./ai-policy-types.js").ResolvedPricingEnvelope["qualityMode"],
    creditPrice: matchingPrice.creditPrice
  });
}
