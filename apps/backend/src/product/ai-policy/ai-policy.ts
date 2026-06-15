import { existsSync } from "node:fs";
import { Effect } from "effect";
import type { BackendConfig } from "../../config/config.js";
import { BackendAIPolicyValidationError } from "../../http/errors.js";
import type {
  BackendAIPolicyBootstrapError,
  BackendAIPolicyServiceContract
} from "./ai-policy-types.js";
import {
  DEFAULT_EXPERIMENTAL_POLICY_MANIFEST_PATH,
  DEFAULT_POLICY_MANIFEST_PATH,
  loadResolvedPolicyDocuments
} from "./ai-policy-loader.js";
import { createBackendAIPolicyService } from "./ai-policy-runtime.js";

export function loadBackendAIPolicyService(
  config: BackendConfig,
  options?: {
    readonly manifestPath?: string;
    readonly optional?: false;
  },
  dependencies?: {
    readonly database?: import("@my-ai-orchestrator/database").DatabaseClient;
    readonly now?: () => Date;
  }
): Effect.Effect<BackendAIPolicyServiceContract, BackendAIPolicyBootstrapError>;
export function loadBackendAIPolicyService(
  config: BackendConfig,
  options: {
    readonly manifestPath?: string;
    readonly optional: true;
  },
  dependencies?: {
    readonly database?: import("@my-ai-orchestrator/database").DatabaseClient;
    readonly now?: () => Date;
  }
): Effect.Effect<BackendAIPolicyServiceContract | undefined, BackendAIPolicyBootstrapError>;
export function loadBackendAIPolicyService(
  config: BackendConfig,
  options: {
    readonly manifestPath?: string;
    readonly optional?: boolean;
  } = {},
  dependencies: {
    readonly database?: import("@my-ai-orchestrator/database").DatabaseClient;
    readonly now?: () => Date;
  } = {}
): Effect.Effect<BackendAIPolicyServiceContract | undefined, BackendAIPolicyBootstrapError> {
  return Effect.gen(function* () {
    const manifestPath = options.manifestPath ?? resolveManifestPath(config, options.optional === true);
    if (options.optional && !manifestPath) {
      return undefined;
    }
    if (!manifestPath) {
      return undefined;
    }

    const { manifest, versionIndex } = yield* loadResolvedPolicyDocuments(manifestPath);
    const activePolicy = versionIndex.get(manifest.activeVersion);

    if (!activePolicy) {
      return yield* Effect.fail(
        new BackendAIPolicyValidationError({
          path: manifestPath,
          message: `Active policy version "${manifest.activeVersion}" is missing from manifest versions`,
          details: { activeVersion: manifest.activeVersion }
        })
      );
    }

    if (!dependencies.database) {
      return yield* Effect.die("Backend AI policy service requires a database client");
    }

    return yield* createBackendAIPolicyService({
      activePolicy,
      versionIndex,
      attachedPolicyVersion: config.aiPolicyAttachedVersion,
      database: dependencies.database,
      namespace: options.optional ? "experimental" : "official",
      now: dependencies.now ?? (() => new Date()),
      reloadIntervalMs: config.aiPolicyReloadIntervalMs
    });
  });
}

function resolveManifestPath(
  config: BackendConfig,
  optional: boolean
): string | undefined {
  const configuredPath = optional
    ? config.experimentalAIPolicyManifestPath
    : config.aiPolicyManifestPath;
  const fallbackPath = optional
    ? DEFAULT_EXPERIMENTAL_POLICY_MANIFEST_PATH
    : DEFAULT_POLICY_MANIFEST_PATH;
  const manifestPath = configuredPath ?? fallbackPath;

  if (optional && !existsSync(manifestPath)) {
    return undefined;
  }

  return manifestPath;
}
