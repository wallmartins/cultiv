import { Effect } from "effect";
import { BackendSafetyPolicyDefinitionError } from "../../http/errors.js";
import type { ResolvedSafetyPolicyDocument } from "./safety-policy-loader.js";
import type {
  BackendSafetyPolicyVersionSummary,
  ResolvedSafetyPolicyVersion,
  SafetyClassificationCategory,
  SafetyClassificationDefinition,
  SafetyDetectorAdapterDefinition,
  SafetyPolicyFamily,
  SafetyPolicyFamilyDefinition
} from "./safety-policy-types.js";

export interface ResolvedSafetyPolicyVersionIndex {
  readonly versions: ReadonlyMap<string, ResolvedSafetyPolicyVersion>;
  readonly versionSummaries: readonly BackendSafetyPolicyVersionSummary[];
  readonly activePolicy: ResolvedSafetyPolicyVersion;
}

export function createResolvedSafetyPolicyVersionIndex(args: {
  readonly activePolicy: ResolvedSafetyPolicyDocument;
  readonly versionIndex: ReadonlyMap<string, ResolvedSafetyPolicyDocument>;
}): ResolvedSafetyPolicyVersionIndex {
  const versions = new Map(
    Array.from(args.versionIndex.entries()).map(([version, document]) => [version, toResolvedSafetyPolicyVersion(document)] as const)
  );
  const activePolicy = versions.get(args.activePolicy.version) ?? toResolvedSafetyPolicyVersion(args.activePolicy);
  const versionSummaries = Array.from(versions.values()).map((policyVersion) => ({
    version: policyVersion.version,
    lifecycle: policyVersion.lifecycle
  })) satisfies readonly BackendSafetyPolicyVersionSummary[];

  return {
    versions,
    versionSummaries,
    activePolicy
  };
}

export function resolveSafetyPolicyFamily(
  policy: ResolvedSafetyPolicyVersion,
  family: SafetyPolicyFamily
): Effect.Effect<SafetyPolicyFamilyDefinition, BackendSafetyPolicyDefinitionError> {
  const definition = policy.families[family];
  if (definition) {
    return Effect.succeed(definition);
  }

  return Effect.fail(
    new BackendSafetyPolicyDefinitionError({
      policyVersion: policy.version,
      family,
      message: `Safety policy family "${family}" is not available in active policy`
    })
  );
}

export function resolveSafetyClassification(
  policy: ResolvedSafetyPolicyVersion,
  category: SafetyClassificationCategory
): Effect.Effect<SafetyClassificationDefinition, BackendSafetyPolicyDefinitionError> {
  const definition = policy.classifications[category];
  if (definition) {
    return Effect.succeed(definition);
  }

  return Effect.fail(
    new BackendSafetyPolicyDefinitionError({
      policyVersion: policy.version,
      classification: category,
      message: `Safety classification "${category}" is not available in active policy`
    })
  );
}

function toResolvedSafetyPolicyVersion(document: ResolvedSafetyPolicyDocument): ResolvedSafetyPolicyVersion {
  const families = Object.fromEntries(
    document.policy.families.map((family) => [family.family, family] as const)
  ) as unknown as Readonly<Record<SafetyPolicyFamily, SafetyPolicyFamilyDefinition>>;
  const classifications = Object.fromEntries(
    document.policy.classifications.map((classification) => [classification.category, classification] as const)
  ) as unknown as Readonly<Record<SafetyClassificationCategory, SafetyClassificationDefinition>>;
  const detectorAdapters = Object.fromEntries(
    document.policy.detectorAdapters.map((adapter) => [adapter.id, adapter] as const)
  ) as unknown as Readonly<Record<string, SafetyDetectorAdapterDefinition>>;

  return {
    version: document.version,
    lifecycle: document.lifecycle,
    families,
    classifications,
    evidenceBoundaries: document.policy.evidenceBoundaries,
    unknownInputOutcome: document.policy.unknownInputOutcome,
    detectorAdapters
  };
}
