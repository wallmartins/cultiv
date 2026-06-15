import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { backendPackageRoot } from "../../package-root.js";
import { Effect, Schema } from "effect";
import {
  BackendAIPolicyCatalogError,
  BackendAIPolicyLoadError,
  BackendAIPolicyValidationError
} from "../../http/errors.js";
import {
  AIPolicyCatalogDocumentSchema,
  AIPolicyManifestSchema,
  AIPolicyPricingDocumentSchema,
  type AIPolicyCatalogDocument,
  type AIPolicyManifest,
  type AIPolicyPricingDocument
} from "./ai-policy-schema.js";
import type { BackendAIPolicyBootstrapError } from "./ai-policy-types.js";

export const DEFAULT_POLICY_MANIFEST_PATH = join(backendPackageRoot, "policies/official/manifest.json");

export const DEFAULT_EXPERIMENTAL_POLICY_MANIFEST_PATH = join(
  backendPackageRoot,
  "policies/experimental/manifest.json"
);

export interface ResolvedVersionDocument {
  readonly version: string;
  readonly lifecycle: "active" | "legacy-supported";
  readonly catalog: AIPolicyCatalogDocument;
  readonly pricing: AIPolicyPricingDocument;
}

export function loadResolvedPolicyDocuments(
  manifestPath: string
): Effect.Effect<
  {
    readonly manifest: AIPolicyManifest;
    readonly versionIndex: ReadonlyMap<string, ResolvedVersionDocument>;
  },
  BackendAIPolicyBootstrapError
> {
  return Effect.gen(function* () {
    const manifest = yield* loadJsonFile(manifestPath, AIPolicyManifestSchema);
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
  version: AIPolicyManifest["versions"][number]
): Effect.Effect<ResolvedVersionDocument, BackendAIPolicyBootstrapError> {
  return Effect.gen(function* () {
    const catalogPath = resolve(manifestDirectory, version.catalogPath);
    const pricingPath = resolve(manifestDirectory, version.pricingPath);
    const catalog = yield* loadJsonFile(catalogPath, AIPolicyCatalogDocumentSchema);
    const pricing = yield* loadJsonFile(pricingPath, AIPolicyPricingDocumentSchema);

    if (catalog.policyVersion !== version.version || pricing.policyVersion !== version.version) {
      return yield* Effect.fail(
        new BackendAIPolicyValidationError({
          path: catalogPath,
          message: `Referenced policy documents must match manifest version "${version.version}"`,
          details: {
            catalogPolicyVersion: catalog.policyVersion,
            pricingPolicyVersion: pricing.policyVersion
          }
        })
      );
    }

    if (pricing.lifecycle !== version.lifecycle) {
      return yield* Effect.fail(
        new BackendAIPolicyValidationError({
          path: pricingPath,
          message: `Pricing lifecycle "${pricing.lifecycle}" does not match manifest lifecycle "${version.lifecycle}"`,
          details: { version: version.version }
        })
      );
    }

    yield* validateCatalogDocument(version.version, catalog);

    return {
      version: version.version,
      lifecycle: version.lifecycle,
      catalog,
      pricing
    };
  });
}

function validateCatalogDocument(
  policyVersion: string,
  catalog: AIPolicyCatalogDocument
): Effect.Effect<void, BackendAIPolicyCatalogError> {
  return Effect.gen(function* () {
    const contentTypeIds = new Set(catalog.contentTypes.map((contentType) => contentType.id));

    for (const pipeline of catalog.pipelines) {
      if (!contentTypeIds.has(pipeline.contentType)) {
        return yield* Effect.fail(
          new BackendAIPolicyCatalogError({
            policyVersion,
            pipelineName: pipeline.pipelineType,
            message: `Pipeline "${pipeline.pipelineType}" references unknown content type "${pipeline.contentType}"`
          })
        );
      }

      for (const step of pipeline.steps) {
        if (step.execution === "local" && step.routingProfile) {
          return yield* Effect.fail(
            new BackendAIPolicyCatalogError({
              policyVersion,
              pipelineName: pipeline.pipelineType,
              stepName: step.name,
              message: `Step "${step.name}" is local and must not declare a routing profile`
            })
          );
        }

        if (step.override && step.execution !== "llm") {
          return yield* Effect.fail(
            new BackendAIPolicyCatalogError({
              policyVersion,
              pipelineName: pipeline.pipelineType,
              stepName: step.name,
              message: `Step "${step.name}" declares override metadata but is not resolved as llm`
            })
          );
        }

        if (step.execution === "llm") {
          if (!step.routingProfile) {
            return yield* Effect.fail(
              new BackendAIPolicyCatalogError({
                policyVersion,
                pipelineName: pipeline.pipelineType,
                stepName: step.name,
                message: `Step "${step.name}" is llm and must declare a routing profile`
              })
            );
          }

          const routingProfile = catalog.routingProfiles.find((profile) => profile.id === step.routingProfile);
          if (!routingProfile) {
            return yield* Effect.fail(
              new BackendAIPolicyCatalogError({
                policyVersion,
                pipelineName: pipeline.pipelineType,
                stepName: step.name,
                message: `Step "${step.name}" references unknown routing profile "${step.routingProfile}"`
              })
            );
          }

          if (routingProfile.preferredAttempts.length === 0) {
            return yield* Effect.fail(
              new BackendAIPolicyCatalogError({
                policyVersion,
                pipelineName: pipeline.pipelineType,
                stepName: step.name,
                message: `Routing profile "${routingProfile.id}" must declare at least one preferred attempt`
              })
            );
          }
        }
      }
    }
  });
}

function loadJsonFile<A, I>(
  path: string,
  schema: Schema.Schema<A, I>
): Effect.Effect<A, BackendAIPolicyLoadError | BackendAIPolicyValidationError> {
  return Effect.gen(function* () {
    const raw = yield* Effect.try({
      try: () => readFileSync(path, "utf8"),
      catch: (cause) =>
        new BackendAIPolicyLoadError({
          path,
          message: cause instanceof Error ? cause.message : `Failed to read ${path}`
        })
    });

    const decodedJson = yield* Effect.try({
      try: () => JSON.parse(raw) as unknown,
      catch: (cause) =>
        new BackendAIPolicyValidationError({
          path,
          message: cause instanceof Error ? cause.message : `Failed to parse JSON from ${path}`
        })
    });

    return yield* Schema.decodeUnknown(schema)(decodedJson).pipe(
      Effect.mapError(
        (cause) =>
          new BackendAIPolicyValidationError({
            path,
            message: `Policy document at "${path}" failed schema validation`,
            details: { cause: String(cause) }
          })
      )
    );
  });
}
