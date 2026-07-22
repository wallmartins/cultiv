import { Effect } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { BackendConfig } from "../../config/config.js";
import { createBackendPersistence } from "../persistence/persistence.js";
import type { BackendAIPolicyBootstrapError } from "../ai-policy/ai-policy-types.js";
import type { BackendSafetyPolicyBootstrapError } from "../safety-policy/safety-policy-types.js";
import { createBackendUsagePolicy } from "../usage/usage-policy.js";
import { createBackendGenerationPreviewService } from "../generation/generation-preview.js";
import { createBackendGenerationPrefillService } from "../generation/generation-prefill.js";
import { createBackendGenreInferenceService } from "../generation/genre-producer.js";
import { createBackendPublicInputSafetyGatewayService } from "../../safety/public-input-safety.js";
import { createBackendOutputReleaseGateService } from "../../safety/output-release.js";
import { createBackendVoiceConsentService } from "../../safety/voice-consent.js";
import { createBackendPolicyEvidenceService } from "../../safety/policy-evidence.js";
import { createBackendOperationalOverrideService } from "../../safety/operational-override.js";
import { createBackendRedactionService } from "../../safety/redaction.js";
import type { BackendProductServices } from "./types.js";
import type { FeatureFlagError } from "@my-ai-orchestrator/feature-flags";
import { createBackendProductDependencies } from "./service-dependencies.js";
import { createBackendVoiceRebuildService } from "../voice/voice-rebuild-service.js";
import { createBackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import { createBackendVoiceService } from "../voice/voice-service.js";
import { createBackendVoiceCalibrationService } from "../voice/voice-calibration-service.js";
import { createBackendObservabilityService } from "./observability.js";
import { createBackendApplicationUserMemoryRepository } from "../../auth/application-user-memory.js";
import { createBackendOperatorMemoryRepository } from "../../auth/operator-memory.js";
import { createPostgresApplicationUserRepository } from "../../infra/postgres-repositories/postgres-application-user-repository.js";
import { createPostgresOperatorRepository } from "../../infra/postgres-repositories/postgres-operator-repository.js";
import { getPostgresDatabase } from "../../infra/postgres-client.js";
import { getSharedRedisClient } from "../../infra/redis-client.js";
import { createRedisTrafficLimitStore } from "../../runtime/redis-rate-limit-store.js";
import { createPostgresBillingGatewayStore } from "../../infra/postgres-billing-gateway-store.js";
import {
  createBillingCheckoutService,
  createBillingGatewayAdapters,
  type BillingCheckoutService
} from "../billing/billing-checkout-service.js";
import {
  createBillingWebhookService,
  type BillingWebhookService
} from "../billing/billing-webhook-service.js";
import {
  createBillingLifecycleService,
  type BillingLifecycleService
} from "../billing/billing-lifecycle-service.js";
import { createBackendAccountService, type BackendAccountService } from "../account/account-service.js";
import { createBackendAccountExportService } from "../account/account-export-service.js";

export function createBackendProductServices(
  config: BackendConfig,
  options: {
    readonly now?: () => Date;
    readonly logger?: AppLogger;
    readonly database?: import("@my-ai-orchestrator/database").DatabaseClient;
    readonly providerTransport?: BackendProviderTransport;
  } = {}
): Effect.Effect<
  BackendProductServices,
  FeatureFlagError | BackendAIPolicyBootstrapError | BackendSafetyPolicyBootstrapError | import("../../infra/database-bootstrap.js").BackendDatabaseBootstrapError
> {
  return Effect.gen(function* () {
    const now = options.now ?? (() => new Date());
    const dependencies = yield* createBackendProductDependencies(config, now, {
      database: options.database
    });
    const redaction = dependencies.redaction;
    const safeLogger = options.logger ? redaction.createRedactedLogger(options.logger) : undefined;
    const observability = yield* createBackendObservabilityService(redaction);
    const policyVersion = (yield* dependencies.safetyPolicy.getActivePolicy()).version;
    const policyEvidence = createBackendPolicyEvidenceService({
      database: dependencies.database,
      policyVersion,
      redaction
    });
    const operationalOverride = createBackendOperationalOverrideService({
      database: dependencies.database,
      now,
      safetyPolicy: dependencies.safetyPolicy,
      policyEvidence,
      redaction
    });
    const voiceConsent = createBackendVoiceConsentService({ database: dependencies.database, now, policyEvidence });
    const providerTransport = options.providerTransport ?? createBackendProviderTransport(config);
    const voiceRebuild = createBackendVoiceRebuildService(
      dependencies.database,
      now,
      observability,
      safeLogger,
      voiceConsent,
      {
        aiAdapters: dependencies.aiAdapters,
        providerTransport,
        featureFlags: dependencies.featureFlags,
        aiPolicy: dependencies.aiPolicy,
        config
      }
    );
    const postgresDatabase = config.databaseUrl
      ? getPostgresDatabase(dependencies.rawDatabase)
      : undefined;
    const inputSafety = createBackendPublicInputSafetyGatewayService({
      safetyPolicy: dependencies.safetyPolicy,
      policyEvidence
    });
    const users = postgresDatabase
      ? createPostgresApplicationUserRepository(postgresDatabase)
      : createBackendApplicationUserMemoryRepository();
    const operators = postgresDatabase
      ? createPostgresOperatorRepository(postgresDatabase)
      : createBackendOperatorMemoryRepository();

    let billingCheckout: BillingCheckoutService | undefined;
    let billingWebhook: BillingWebhookService | undefined;
    let billingLifecycle: BillingLifecycleService | undefined;
    let accountOps: BackendAccountService | undefined;
    const gatewayStore = postgresDatabase ? createPostgresBillingGatewayStore(postgresDatabase) : undefined;
    if (postgresDatabase && gatewayStore) {
      const adapters = createBillingGatewayAdapters(config);
      const billingDeps = {
        billing: dependencies.billing,
        gatewayStore,
        stripeAdapter: adapters.stripe,
        asaasAdapter: adapters.asaas,
        config,
        now
      };
      billingCheckout = createBillingCheckoutService(billingDeps);
      billingWebhook = createBillingWebhookService(billingDeps);
      billingLifecycle = createBillingLifecycleService(billingDeps);

      // contract-08 — account delete's storage transaction (tombstone, billing anonymization,
      // execution_idempotency) is Postgres-only, same gate as the billing services above.
      accountOps = createBackendAccountService({
        users,
        database: dependencies.database,
        gatewayCancel: {
          billing: dependencies.billing,
          gatewayStore,
          stripeAdapter: adapters.stripe,
          asaasAdapter: adapters.asaas
        },
        now
      });
    }

    // export doesn't need Postgres (services.database works in-memory too) — gated on Redis only,
    // the storage backing the short-TTL/one-time download handle.
    const accountExport = config.redisUrl
      ? createBackendAccountExportService({
          database: dependencies.database,
          billing: dependencies.billing,
          users,
          redis: getSharedRedisClient(config),
          now
        })
      : undefined;

    return {
      ...dependencies,
      observability,
      persistence: createBackendPersistence(dependencies.database, now),
      aiPolicy: dependencies.aiPolicy,
      experimentalAIPolicy: dependencies.experimentalAIPolicy,
      safetyPolicy: dependencies.safetyPolicy,
      inputSafety,
      outputSafety: createBackendOutputReleaseGateService({
        safetyPolicy: dependencies.safetyPolicy,
        policyEvidence
      }),
      usagePolicy: createBackendUsagePolicy({
        billing: dependencies.billing,
        featureFlagRegistry: dependencies.featureFlagRegistry,
        config,
        now,
        incrementTraffic:
          config.redisUrl && !config.allowInMemoryRuntime
            ? (key) => {
                const store = createRedisTrafficLimitStore(getSharedRedisClient(config));
                return store.increment(key, 86_400_000);
              }
            : undefined
      }),
      generationPreview: createBackendGenerationPreviewService({
        config,
        database: dependencies.database,
        billing: dependencies.billing,
        aiPolicy: dependencies.aiPolicy,
        inputSafety,
        featureFlags: dependencies.featureFlags
      }),
      generationPrefill: createBackendGenerationPrefillService({
        database: dependencies.database,
        aiAdapters: dependencies.aiAdapters,
        providerTransport,
        aiPolicy: dependencies.aiPolicy
      }),
      genreInference: createBackendGenreInferenceService({
        aiAdapters: dependencies.aiAdapters,
        providerTransport,
        aiPolicy: dependencies.aiPolicy
      }),
      voiceRebuild,
      voiceConsent,
      voice: createBackendVoiceService(
        dependencies.database,
        voiceRebuild,
        now,
        observability,
        safeLogger,
        voiceConsent,
        {
          featureFlags: dependencies.featureFlags,
          config
        }
      ),
      voiceCalibration: createBackendVoiceCalibrationService(
        dependencies.database,
        voiceRebuild,
        dependencies.billing,
        now,
        voiceConsent,
        safeLogger,
        {
          aiAdapters: dependencies.aiAdapters,
          providerTransport,
          aiPolicy: dependencies.aiPolicy
        }
      ),
      policyEvidence,
      operationalOverride,
      redaction,
      users,
      operators,
      billingCheckout,
      billingWebhook,
      billingLifecycle,
      billingGatewayStore: gatewayStore,
      accountOps,
      accountExport
    };
  }) as Effect.Effect<
    BackendProductServices,
    FeatureFlagError | BackendAIPolicyBootstrapError | BackendSafetyPolicyBootstrapError
  >;
}
