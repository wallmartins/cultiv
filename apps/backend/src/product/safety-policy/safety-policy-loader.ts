import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { backendPackageRoot } from "../../package-root.js";
import { Effect, Schema } from "effect";
import {
  BackendSafetyPolicyDefinitionError,
  BackendSafetyPolicyLoadError,
  BackendSafetyPolicyValidationError
} from "../../http/errors.js";
import {
  SafetyPolicyDocumentSchema,
  SafetyPolicyManifestSchema,
  type SafetyPolicyDocument,
  type SafetyPolicyManifest
} from "./safety-policy-schema.js";
import type {
  BackendSafetyPolicyBootstrapError,
  SafetyClassificationCategory,
  SafetyEvidenceBoundary,
  SafetyPolicyFamily
} from "./safety-policy-types.js";

export const DEFAULT_SAFETY_POLICY_MANIFEST_PATH = join(
  backendPackageRoot,
  "policies/safety/official/manifest.json"
);

export interface ResolvedSafetyPolicyDocument {
  readonly version: string;
  readonly lifecycle: "active" | "legacy-supported";
  readonly policy: SafetyPolicyDocument;
}

const requiredPolicyFamilies = [
  "input",
  "imported_context",
  "step_scope",
  "consent",
  "output_release",
  "policy_evidence",
  "operational_override"
] as const satisfies readonly SafetyPolicyFamily[];

const requiredClassificationCategories = [
  "ordinary_generation_input",
  "imported_context_out_of_scope",
  "voice_training_input",
  "personal_data",
  "customer_confidential_data",
  "operational_data",
  "security_sensitive_data",
  "llm_prohibited_data"
] as const satisfies readonly SafetyClassificationCategory[];

const requiredEvidenceBoundaries = [
  "input",
  "scope",
  "output",
  "consent",
  "override"
] as const satisfies readonly SafetyEvidenceBoundary[];

export function loadResolvedSafetyPolicyDocuments(
  manifestPath: string
): Effect.Effect<
  {
    readonly manifest: SafetyPolicyManifest;
    readonly versionIndex: ReadonlyMap<string, ResolvedSafetyPolicyDocument>;
  },
  BackendSafetyPolicyBootstrapError
> {
  return Effect.gen(function* () {
    const manifest = yield* loadJsonFile(manifestPath, SafetyPolicyManifestSchema);
    const manifestDirectory = dirname(manifestPath);
    const versions = yield* Effect.all(
      manifest.versions.map((version) => loadResolvedVersion(manifestDirectory, version))
    );

    return {
      manifest,
      versionIndex: new Map(versions.map((version) => [version.version, version] as const))
    };
  });
}

function loadResolvedVersion(
  manifestDirectory: string,
  version: SafetyPolicyManifest["versions"][number]
): Effect.Effect<ResolvedSafetyPolicyDocument, BackendSafetyPolicyBootstrapError> {
  return Effect.gen(function* () {
    const policyPath = resolve(manifestDirectory, version.policyPath);
    const policy = yield* loadJsonFile(policyPath, SafetyPolicyDocumentSchema);

    if (policy.policyVersion !== version.version) {
      return yield* Effect.fail(
        new BackendSafetyPolicyValidationError({
          path: policyPath,
          message: `Safety policy document version "${policy.policyVersion}" does not match manifest version "${version.version}"`,
          details: {
            policyVersion: policy.policyVersion,
            manifestVersion: version.version
          }
        })
      );
    }

    if (policy.lifecycle !== version.lifecycle) {
      return yield* Effect.fail(
        new BackendSafetyPolicyValidationError({
          path: policyPath,
          message: `Safety policy lifecycle "${policy.lifecycle}" does not match manifest lifecycle "${version.lifecycle}"`,
          details: { version: version.version }
        })
      );
    }

    yield* validateSafetyPolicyDocument(policy);

    return {
      version: version.version,
      lifecycle: version.lifecycle,
      policy
    };
  });
}

function validateSafetyPolicyDocument(
  policy: SafetyPolicyDocument
): Effect.Effect<void, BackendSafetyPolicyDefinitionError> {
  return Effect.gen(function* () {
    const policyFamilies = new Map(policy.families.map((family) => [family.family, family] as const));
    const classifications = new Map(
      policy.classifications.map((classification) => [classification.category, classification] as const)
    );
    const detectorAdapters = new Set(policy.detectorAdapters.map((adapter) => adapter.id));
    const evidenceBoundaries = new Set(policy.evidenceBoundaries);

    for (const family of requiredPolicyFamilies) {
      if (!policyFamilies.has(family)) {
        return yield* Effect.fail(
          new BackendSafetyPolicyDefinitionError({
            policyVersion: policy.policyVersion,
            family,
            message: `Safety policy must declare family "${family}"`
          })
        );
      }
    }

    for (const classification of requiredClassificationCategories) {
      if (!classifications.has(classification)) {
        return yield* Effect.fail(
          new BackendSafetyPolicyDefinitionError({
            policyVersion: policy.policyVersion,
            classification,
            message: `Safety policy must declare classification "${classification}"`
          })
        );
      }
    }

    for (const boundary of requiredEvidenceBoundaries) {
      if (!evidenceBoundaries.has(boundary)) {
        return yield* Effect.fail(
          new BackendSafetyPolicyDefinitionError({
            policyVersion: policy.policyVersion,
            boundary,
            message: `Safety policy must declare evidence boundary "${boundary}"`
          })
        );
      }
    }

    for (const family of policy.families) {
      if (!family.allowedOutcomes.includes(family.defaultOutcome)) {
        return yield* Effect.fail(
          new BackendSafetyPolicyDefinitionError({
            policyVersion: policy.policyVersion,
            family: family.family,
            message: `Family "${family.family}" must include default outcome "${family.defaultOutcome}" in allowed outcomes`
          })
        );
      }

      if (!evidenceBoundaries.has(family.evidenceBoundary)) {
        return yield* Effect.fail(
          new BackendSafetyPolicyDefinitionError({
            policyVersion: policy.policyVersion,
            family: family.family,
            boundary: family.evidenceBoundary,
            message: `Family "${family.family}" references unknown evidence boundary "${family.evidenceBoundary}"`
          })
        );
      }

      for (const detectorAdapter of family.detectorAdapters) {
        if (!detectorAdapters.has(detectorAdapter)) {
          return yield* Effect.fail(
            new BackendSafetyPolicyDefinitionError({
              policyVersion: policy.policyVersion,
              family: family.family,
              message: `Family "${family.family}" references unknown detector adapter "${detectorAdapter}"`
            })
          );
        }
      }
    }
  });
}

function loadJsonFile<A, I>(
  path: string,
  schema: Schema.Schema<A, I>
): Effect.Effect<A, BackendSafetyPolicyLoadError | BackendSafetyPolicyValidationError> {
  return Effect.gen(function* () {
    const raw = yield* Effect.try({
      try: () => readFileSync(path, "utf8"),
      catch: (cause) =>
        new BackendSafetyPolicyLoadError({
          path,
          message: cause instanceof Error ? cause.message : `Failed to read ${path}`
        })
    });

    const decodedJson = yield* Effect.try({
      try: () => JSON.parse(raw) as unknown,
      catch: (cause) =>
        new BackendSafetyPolicyValidationError({
          path,
          message: cause instanceof Error ? cause.message : `Failed to parse JSON from ${path}`
        })
    });

    return yield* Schema.decodeUnknown(schema)(decodedJson).pipe(
      Effect.mapError(
        (cause) =>
          new BackendSafetyPolicyValidationError({
            path,
            message: `Safety policy document at "${path}" failed schema validation`,
            details: { cause: String(cause) }
          })
      )
    );
  });
}
