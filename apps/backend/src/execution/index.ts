import { Effect } from "effect";
import type {
  PipelineRequest,
  } from "@my-ai-orchestrator/contracts";
import { resolveBackendBillingIdentity } from "./billing.js";
import { resolveStoredUserPlanId } from "../product/billing/resolve-user-billing.js";
import {
  buildOrchestrationPlan,
  createJobCoordinator
} from "@my-ai-orchestrator/orchestrator";
import {
  BackendExecutionConflictError,
  BackendExecutionFailedError,
  BackendOutputReleasePolicyError,
  BackendUsageAuthorizationError
} from "../http/errors.js";
import { createExecutionFailure, normalizeExecutionFailure } from "./pipeline/execution-failure.js";
import { executeSyncRun } from "./runtime.js";
import { readGenerationChannel } from "./pipeline-metadata.js";
import { stableStringify } from "./quality/quality.js";
import { createQueuedRun } from "./queued-run.js";
import { validateTrustedExecutionSnapshot } from "./pipeline/trusted-snapshot.js";
import { resolveUsagePolicyModel } from "../product/usage/resolve-usage-policy-model.js";
import { createBackendProviderTransport } from "./pipeline/provider-transport.js";
import { resolveExecutionIdempotencyStore } from "./idempotency-store.js";
import type {
  BackendExecutionOptions,
  BackendExecutionService,
  PreparedExecution
} from "./service-types.js";
import type { ResolvedExecutionSnapshot } from "../product/ai-policy/ai-policy-types.js";

export type {
  BackendExecutionOptions,
  BackendExecutionService
} from "./service-types.js";

export function createBackendExecutionService(options: BackendExecutionOptions): BackendExecutionService {
  const idempotencyStore = resolveExecutionIdempotencyStore({
    runtimeMode: options.runtimeMode,
    rawDatabase: options.services.rawDatabase,
    now: options.now,
    idempotencyStore: options.idempotencyStore
  });
  const jobCoordinator = createJobCoordinator();
  const providerTransport = options.providerTransport ?? createBackendProviderTransport(options.config);

  const resolveIdempotencyUserId = (request: PipelineRequest) =>
    "userId" in request && typeof request.userId === "string"
      ? request.userId
      : options.config.billingUserId ?? options.config.serviceName;

  return {
    execute: (request) =>
      runExecution(request, false),
    executeTrusted: (snapshot, executionOptions) =>
      runTrustedExecution(snapshot, executionOptions)
  };

  function runExecution(
    request: PipelineRequest,
    skipAuthorization: boolean
  ) {
    return Effect.gen(function* () {
        yield* options.services.aiPolicy.validatePipelineRequest(request);
        const plan = buildOrchestrationPlan(request, {
          catalog: options.services.aiPolicy.getActiveOrchestrationCatalog(),
          executionMode: options.config.executionMode,
          qualityMode: options.config.qualityMode,
          defaultLanguage: options.config.defaultLanguage
        });
        return yield* runPreparedExecution(
          {
            request,
            plan
          },
          skipAuthorization,
          { request }
        );
      });
  }

  function runTrustedExecution(
    snapshot: ResolvedExecutionSnapshot,
    executionOptions: {
      readonly simulateCredits?: boolean;
    } = {}
  ) {
    return Effect.gen(function* () {
      yield* validateTrustedExecutionSnapshot(snapshot);
      return yield* runPreparedExecution(
        {
          request: snapshot.request,
          plan: snapshot.plan,
          pricingEnvelope: snapshot.pricingEnvelope,
          simulateCredits: executionOptions.simulateCredits
        },
        true,
        {
          request: snapshot.request,
          executionSnapshot: {
            policyVersion: snapshot.policyVersion,
            contentType: snapshot.pricingEnvelope.contentType,
            qualityMode: snapshot.pricingEnvelope.qualityMode,
            creditPrice: snapshot.pricingEnvelope.creditPrice
          }
        }
      );
    });
  }

  function runPreparedExecution(
    prepared: PreparedExecution,
    skipAuthorization: boolean,
    fingerprintSeed: Readonly<Record<string, unknown>>
  ) {
    return Effect.gen(function* () {
      yield* options.services.persistence.recordExecutionPlan(prepared.plan);
      const fingerprint = stableStringify({
        ...fingerprintSeed,
        executionMode: options.config.executionMode,
        qualityMode: options.config.qualityMode,
        defaultLanguage: options.config.defaultLanguage
      });
      const idempotencyKey = prepared.plan.request.idempotencyKey;

      if (idempotencyKey) {
        const userId = resolveIdempotencyUserId(prepared.request);
        const cachedResponse = yield* idempotencyStore.find(userId, idempotencyKey, fingerprint);
        if (cachedResponse) {
          return cachedResponse;
        }
      }

      const strategy = jobCoordinator.selectStrategy(prepared.plan, {
        defaultExecutionMode: options.config.executionMode,
        defaultQualityMode: options.config.qualityMode,
        defaultLanguage: options.config.defaultLanguage
      });

      if (!skipAuthorization) {
        const executionUserId =
          "userId" in prepared.plan.request && typeof prepared.plan.request.userId === "string"
            ? prepared.plan.request.userId
            : options.config.billingUserId ?? options.config.serviceName;

        yield* options.services.usagePolicy.authorize({
          request: prepared.request,
          plan: prepared.plan,
          executionMode: strategy.mode,
          qualityMode: prepared.plan.request.qualityMode,
          userId: executionUserId,
          planId: resolveStoredUserPlanId(options.services.billing, executionUserId),
          model: resolveUsagePolicyModel(
            prepared.request,
            prepared.plan.request.qualityMode ?? options.config.qualityMode
          ),
          adapter: prepared.request.adapter ?? options.config.serviceName
        });
      }

      const effectiveVoice = yield* options.services.voice.resolveEffectiveVoice(
        resolveBackendBillingIdentity(
          prepared.request,
          options.services.billing,
          options.config,
          `generation:${prepared.plan.pipeline.name}:${prepared.plan.request.idempotencyKey ?? "anonymous"}`
        ).userId,
        {
          channel: readGenerationChannel("context" in prepared.request ? prepared.request.context : undefined),
          requestedLanguage: prepared.plan.request.language ?? prepared.plan.contentType.defaultLanguage
        }
      );
      if (!effectiveVoice) {
        return yield* Effect.fail(
          createExecutionFailure({
            message: `Failed to resolve a usable voice profile for pipeline "${prepared.plan.pipeline.name}"`,
            reason: "voice_profile_unavailable"
          })
        );
      }

      const voice = effectiveVoice.metadata;

      if (strategy.mode === "async") {
        const response = yield* createQueuedRun(prepared.plan, prepared.request, {
          ...options,
          voice,
          pricingEnvelope: prepared.pricingEnvelope,
          simulateCredits: prepared.simulateCredits
        });
        const queuedResponse = { ...response, voice };
        if (idempotencyKey) {
          yield* idempotencyStore.save(
            resolveIdempotencyUserId(prepared.request),
            idempotencyKey,
            fingerprint,
            queuedResponse,
            response.jobId
          );
        }
        return queuedResponse;
      }

      const syncResponse = yield* executeSyncRun({
        plan: prepared.plan,
        request: prepared.request,
        pricingEnvelope: prepared.pricingEnvelope,
        config: options.config,
        now: options.now,
        includeTrace: "includeTrace" in prepared.request ? Boolean(prepared.request.includeTrace) : false,
        services: options.services,
        providerTransport,
        memory: options.memory,
        corpus: options.corpus,
        simulateCredits: prepared.simulateCredits
      }).pipe(
        Effect.catchAll((error) =>
          Effect.fail(normalizeExecutionFailure(error, {
            message: `Failed to execute pipeline "${prepared.plan.pipeline.name}"`,
            reason: "unexpected_execution_failure"
          }))
        )
      );

      const userId = "userId" in prepared.request && typeof prepared.request.userId === "string"
        ? prepared.request.userId
        : options.config.billingUserId ?? options.config.serviceName;

      const releasedOutput = yield* options.services.outputSafety.authorizeOutput(
        syncResponse.content,
        {
          contentType: prepared.plan.contentType.id,
          pipelineName: prepared.plan.pipeline.name,
          userId
        }
      ).pipe(
        Effect.catchTag("BackendOutputReleasePolicyError", (error) =>
          Effect.fail(
            createExecutionFailure({
              message: `Output release blocked for pipeline "${prepared.plan.pipeline.name}": ${error.message}`,
              reason: "output_release_blocked"
            })
          )
        ),
        Effect.catchAll((error) =>
          Effect.fail(normalizeExecutionFailure(error, {
            message: `Output release evaluation failed for pipeline "${prepared.plan.pipeline.name}"`,
            reason: "output_release_evaluation_failed"
          }))
        )
      );

      const releasedSyncResponse = {
        ...syncResponse,
        content: releasedOutput.content
      };

      if (idempotencyKey) {
        yield* idempotencyStore.save(
          resolveIdempotencyUserId(prepared.request),
          idempotencyKey,
          fingerprint,
          releasedSyncResponse
        );
      }

      return {
        ...releasedSyncResponse,
        voice
      };
    });
  }
}
