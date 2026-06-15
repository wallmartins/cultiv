import { Effect } from "effect";
import type { BackendConfig } from "../../config/config.js";
import { BackendSafetyPolicyValidationError } from "../../http/errors.js";
import {
  DEFAULT_SAFETY_POLICY_MANIFEST_PATH,
  loadResolvedSafetyPolicyDocuments
} from "./safety-policy-loader.js";
import {
  createResolvedSafetyPolicyVersionIndex,
  resolveSafetyClassification,
  resolveSafetyPolicyFamily
} from "./safety-policy-version-index.js";
import type {
  BackendSafetyPolicyBootstrapError,
  BackendSafetyPolicyServiceContract
} from "./safety-policy-types.js";

export function loadBackendSafetyPolicyService(
  config: BackendConfig,
  options: {
    readonly manifestPath?: string;
  } = {}
): Effect.Effect<BackendSafetyPolicyServiceContract, BackendSafetyPolicyBootstrapError> {
  return Effect.gen(function* () {
    const manifestPath = options.manifestPath ?? config.safetyPolicyManifestPath ?? DEFAULT_SAFETY_POLICY_MANIFEST_PATH;
    const { manifest, versionIndex } = yield* loadResolvedSafetyPolicyDocuments(manifestPath);
    const activePolicy = versionIndex.get(manifest.activeVersion);

    if (!activePolicy) {
      return yield* Effect.fail(
        new BackendSafetyPolicyValidationError({
          path: manifestPath,
          message: `Active safety policy version "${manifest.activeVersion}" is missing from manifest versions`,
          details: { activeVersion: manifest.activeVersion }
        })
      );
    }

    const index = createResolvedSafetyPolicyVersionIndex({
      activePolicy,
      versionIndex
    });

    return {
      getActivePolicy: () => Effect.succeed(index.activePolicy),
      listPolicyVersions: () => index.versionSummaries,
      getPolicyFamily: (family) => resolveSafetyPolicyFamily(index.activePolicy, family),
      getClassification: (category) => resolveSafetyClassification(index.activePolicy, category)
    } satisfies BackendSafetyPolicyServiceContract;
  });
}
