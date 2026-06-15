import { Effect } from "effect";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import {
  createAIAdapterRegistry,
  createAIAdapterService,
  registerDefaultAIProviders,
  type AIAdapterServiceContract
} from "@my-ai-orchestrator/ai-adapters";
import {
  createFeatureFlagRegistry,
  createFeatureFlagService,
  type FeatureFlagError,
  type FeatureFlagRegistry,
  type FeatureFlagServiceContract
} from "@my-ai-orchestrator/feature-flags";
import { createBillingRepository, createBillingService, type BillingRepository } from "@my-ai-orchestrator/payments";
import type { BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { BackendConfig } from "../../config/config.js";
import { createBackendDatabaseClient } from "../../infra/database-bootstrap.js";
import { getPostgresDatabase } from "../../infra/postgres-client.js";
import { loadBillingRepository } from "../../infra/durable-store.js";
import { createPersistingBillingService } from "../billing/durable-billing.js";
import { loadBackendAIPolicyService } from "../ai-policy/ai-policy.js";
import type { BackendAIPolicyBootstrapError, BackendAIPolicyServiceContract } from "../ai-policy/ai-policy-types.js";
import { loadBackendSafetyPolicyService } from "../safety-policy/safety-policy.js";
import type { BackendSafetyPolicyBootstrapError, BackendSafetyPolicyServiceContract } from "../safety-policy/safety-policy-types.js";
import { resolveBackendFeatureFlags } from "./feature-flags.js";
import { createBackendRedactionService } from "../../safety/redaction.js";
import { createBackendVoiceFieldProtectionService } from "../../safety/voice-field-protection.js";
import { createProtectedVoiceTrainingDatabaseClient } from "../voice/protected-voice-training-database.js";
import { registerBackendBillingPlans, seedBillingState } from "../billing/billing-bootstrap.js";
import type { SafetyClassificationCategory } from "../safety-policy/safety-policy-types.js";

export interface BackendProductDependencies {
  readonly database: DatabaseClient;
  readonly featureFlagRegistry: FeatureFlagRegistry;
  readonly featureFlags: FeatureFlagServiceContract;
  readonly aiAdapters: AIAdapterServiceContract;
  readonly billing: BillingServiceContract;
  readonly billingRepository: BillingRepository;
  readonly aiPolicy: BackendAIPolicyServiceContract;
  readonly experimentalAIPolicy?: BackendAIPolicyServiceContract;
  readonly safetyPolicy: BackendSafetyPolicyServiceContract;
  readonly redaction: import("../safety/redaction-types.js").BackendRedactionService;
  readonly rawDatabase: DatabaseClient;
}

export function createBackendProductDependencies(
  config: BackendConfig,
  now: () => Date,
  options: {
    readonly database?: DatabaseClient;
  } = {}
): Effect.Effect<
  BackendProductDependencies,
  FeatureFlagError | BackendAIPolicyBootstrapError | BackendSafetyPolicyBootstrapError | import("../infra/database-bootstrap.js").BackendDatabaseBootstrapError
> {
  return Effect.gen(function* () {
    const database = options.database ?? (yield* createBackendDatabaseClient(config));
    const featureFlagRegistry = yield* createFeatureFlagRegistry(resolveBackendFeatureFlags(config));
    const featureFlags = yield* createFeatureFlagService({ registry: featureFlagRegistry });
    const aiAdapters = createAIAdapterService(registerDefaultAIProviders(createAIAdapterRegistry()));
    const postgres = config.databaseUrl ? getPostgresDatabase(database) : undefined;
    const billingRepository = postgres
      ? yield* loadBillingRepository(postgres)
      : createBillingRepository();
    const billing = postgres
      ? createPersistingBillingService(postgres, billingRepository, now)
      : createBillingService({ repository: billingRepository });
    const aiPolicy = yield* loadBackendAIPolicyService(config, {}, {
      database,
      now
    });
    const experimentalAIPolicy = yield* loadBackendAIPolicyService(config, {
      manifestPath: config.experimentalAIPolicyManifestPath,
      optional: true
    }, {
      database,
      now
    });
    const safetyPolicy = yield* loadBackendSafetyPolicyService(config);
    const activeSafetyPolicy = yield* safetyPolicy.getActivePolicy();
    const redaction = createBackendRedactionService({
      redactedClassifications: resolveProtectedDiagnosticClassifications(activeSafetyPolicy.classifications)
    });
    const voiceFieldProtection = createBackendVoiceFieldProtectionService({
      keyMaterial: resolveVoiceDataProtectionKeyMaterial(config),
      previousKeyMaterial: config.voiceDataProtectionPreviousKey
    });
    const protectedDatabase = createProtectedVoiceTrainingDatabaseClient(database, voiceFieldProtection);

    yield* registerBackendBillingPlans(billing);
    yield* seedBillingState(billing, config, now);

    return {
      database: protectedDatabase,
      rawDatabase: database,
      featureFlagRegistry,
      featureFlags,
      aiAdapters,
      billing,
      billingRepository,
      aiPolicy,
      experimentalAIPolicy,
      safetyPolicy,
      redaction
    };
  });
}

function resolveVoiceDataProtectionKeyMaterial(config: BackendConfig): string {
  return config.voiceDataProtectionKey ?? `${config.serviceName}:${config.environment}:voice-training-protection`;
}

function resolveProtectedDiagnosticClassifications(
  classifications: Readonly<Record<SafetyClassificationCategory, { readonly minimizationRequired: boolean }>>
): readonly SafetyClassificationCategory[] {
  return (Object.entries(classifications) as Array<[SafetyClassificationCategory, { readonly minimizationRequired: boolean }]>)
    .filter(([category, definition]) =>
      definition.minimizationRequired && category !== "ordinary_generation_input"
    )
    .map(([category]) => category);
}
