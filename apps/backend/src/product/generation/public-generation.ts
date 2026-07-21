import { Effect } from "effect";
import type { ExplicitPipelineRequest, PipelineRequest } from "@my-ai-orchestrator/contracts";
import { createJobCoordinator } from "@my-ai-orchestrator/orchestrator";
import type { BackendConfig } from "../../config/config.js";
import { BackendAIPolicyCatalogError, BackendUsageAuthorizationError, BackendValidationError } from "../../http/errors.js";
import { resolveGenerationTarget } from "./resolve-generation-target.js";
import { mergeCompositorPipelineContext } from "./merge-compositor-pipeline-context.js";
import { isGenerationStepPlannerEnabled } from "./is-step-planner-enabled.js";
import type { BackendExecutionService } from "../../execution/service-types.js";
import { assertQuoteConsistency, toGenerationPricingSnapshot } from "../billing/generation-pricing-snapshot.js";
import { canAfford } from "../billing/commercial-access.js";
import type { QualityMode } from "@my-ai-orchestrator/contracts";
import { canUseQualityMode, hasActiveBillingSubscription } from "@my-ai-orchestrator/payments";
import { resolveUsagePolicyModel } from "../usage/resolve-usage-policy-model.js";
import { resolveStoredUserEntitlement, resolveStoredUserPlanId, resolveStoredUserPlanTier } from "../billing/resolve-user-billing.js";
import type { BackendProductServices } from "../core/types.js";
import type { BackendPublicGenerationRequest, BackendPublicGenerationService } from "./public-generation-types.js";
import type { SanitizedGenerationInput } from "../../safety/public-input-safety-types.js";

export function createBackendPublicGenerationService(options: {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
  readonly execution: BackendExecutionService;
}): BackendPublicGenerationService {
  const jobCoordinator = createJobCoordinator();

  return {
    execute(request) {
      return Effect.gen(function* () {
        const sanitizedRequest = yield* options.services.inputSafety.authorizeGenerationInput(request);
        const internalRequest = yield* toInternalPipelineRequest(
          {
            ...request,
            ...sanitizedRequest
          },
          options.services,
          options.config
        );
        const planTier = resolveStoredUserPlanTier(options.services.billing, request.userId);
        const executionSnapshot = yield* options.services.aiPolicy.resolveExecutionSnapshot({
          request: markPipelineRequestSanitized(internalRequest),
          planTier,
          executionMode: options.config.executionMode,
          qualityMode: options.config.qualityMode,
          defaultLanguage: options.config.defaultLanguage,
          attachedPolicyVersion: options.config.aiPolicyAttachedVersion
        });
        const strategy = jobCoordinator.selectStrategy(executionSnapshot.plan, {
          defaultExecutionMode: options.config.executionMode,
          defaultQualityMode: options.config.qualityMode,
          defaultLanguage: options.config.defaultLanguage
        });

        yield* assertPublicGenerationAccess({
          services: options.services,
          request,
          pricing: executionSnapshot.pricingEnvelope
        });

        if (request.quoteId) {
          yield* assertQuoteConsistency({
            providedQuoteId: request.quoteId,
            pricingSnapshot: toGenerationPricingSnapshot(executionSnapshot.pricingEnvelope)
          });
        }

        yield* options.services.usagePolicy.authorize({
          request: internalRequest,
          plan: executionSnapshot.plan,
          executionMode: strategy.mode,
          qualityMode: executionSnapshot.plan.request.qualityMode,
          userId: request.userId,
          planId: resolveStoredUserPlanId(options.services.billing, request.userId),
          model: resolveUsagePolicyModel(
            internalRequest,
            executionSnapshot.plan.request.qualityMode ?? options.config.qualityMode
          ),
          adapter: internalRequest.adapter ?? options.config.serviceName
        });

        return yield* options.execution.executeTrusted(executionSnapshot);
      });
    }
  };
}

// internalRequest is rebuilt purely from fields authorizeGenerationInput already
// sanitized above; carry the brand forward for the execution-snapshot boundary.
function markPipelineRequestSanitized(request: PipelineRequest): SanitizedGenerationInput<PipelineRequest> {
  return request as SanitizedGenerationInput<PipelineRequest>;
}

function toInternalPipelineRequest(
  request: BackendPublicGenerationRequest,
  services: BackendProductServices,
  config: BackendConfig
): Effect.Effect<PipelineRequest, BackendAIPolicyCatalogError | BackendValidationError> {
  return Effect.gen(function* () {
    const stepPlannerEnabled = isGenerationStepPlannerEnabled(services.featureFlags, config);
    const resolvedTarget = yield* resolveGenerationTarget({
      rhetoricalMode: request.rhetoricalMode,
      scope: request.scope,
      stepPlannerEnabled,
      briefing: request.briefing,
      qualityMode: request.qualityMode
    });

    const plan = resolvedTarget.compositor.plan;
    const channel = request.scope?.channel ?? "unspecified";
    const context = mergeCompositorPipelineContext(
      request.context,
      plan,
      channel,
      resolvedTarget.stepPlanner
    );

    return {
      userId: request.userId,
      pipeline: resolvedTarget.compositor.pipeline,
      inputs: buildCompositorPipelineInputs(request.briefing, plan),
      importedContext: request.importedContext,
      context,
      language: request.language,
      qualityMode: request.qualityMode,
      model: request.model,
      quoteId: request.quoteId,
      previewRecommendation: request.previewRecommendation,
      includeTrace: request.includeTrace,
      idempotencyKey: request.idempotencyKey
    } satisfies ExplicitPipelineRequest;
  });
}

function buildCompositorPipelineInputs(
  briefing: BackendPublicGenerationRequest["briefing"],
  plan: import("@my-ai-orchestrator/contracts").ExecutionPlan
): Record<string, unknown> {
  const briefingInputs =
    typeof briefing === "object" && briefing !== null ? briefing : { briefing };

  return {
    ...briefingInputs,
    wordTarget: plan.parameters.wordTarget,
    expressionProfile: plan.parameters.expressionProfile
  };
}

function assertPublicGenerationAccess(args: {
  readonly services: BackendProductServices;
  readonly request: BackendPublicGenerationRequest;
  readonly pricing: {
    readonly contentType: string;
    readonly qualityMode: string;
    readonly creditPrice: number;
  };
}): Effect.Effect<void, BackendUsageAuthorizationError> {
  const entitlement = resolveStoredUserEntitlement(args.services.billing, args.request.userId) ?? null;
  if (entitlement === null) {
    return Effect.fail(
      new BackendUsageAuthorizationError({
        userId: args.request.userId,
        planId: resolveStoredUserPlanId(args.services.billing, args.request.userId),
        reason: "plan_restriction",
        message: `Generation requires an active subscription before it can run`
      })
    );
  }

  if (!hasActiveBillingSubscription(entitlement)) {
    return Effect.fail(
      new BackendUsageAuthorizationError({
        userId: args.request.userId,
        planId: entitlement.planId,
        reason: "subscription_inactive",
        message: `Subscription is inactive for plan "${entitlement.planId}"`
      })
    );
  }

  const qualityMode = args.pricing.qualityMode as QualityMode;
  if (!canUseQualityMode(entitlement, qualityMode)) {
    return Effect.fail(
      new BackendUsageAuthorizationError({
        userId: args.request.userId,
        planId: entitlement.planId,
        reason: "quality_mode_plan_restriction",
        message: `Quality mode "${qualityMode}" is not enabled for plan tier "${entitlement.tier}"`
      })
    );
  }

  if (!canAfford(entitlement.wallet.availableCredits, args.pricing.creditPrice)) {
    return Effect.fail(
      new BackendUsageAuthorizationError({
        userId: args.request.userId,
        planId: entitlement.planId,
        reason: "insufficient_credits",
        message: `Insufficient credits for "${args.pricing.contentType}" in quality mode "${args.pricing.qualityMode}"`
      })
    );
  }

  return Effect.void;
}
