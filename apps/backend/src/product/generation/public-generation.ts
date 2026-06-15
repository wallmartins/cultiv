import { Effect } from "effect";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import { createJobCoordinator } from "@my-ai-orchestrator/orchestrator";
import type { BackendConfig } from "../../config/config.js";
import { BackendAIPolicyCatalogError, BackendUsageAuthorizationError } from "../../http/errors.js";
import type { BackendExecutionService } from "../../execution/service-types.js";
import { assertQuoteConsistency, toGenerationPricingSnapshot } from "../billing/generation-pricing-snapshot.js";
import type { QualityMode } from "@my-ai-orchestrator/contracts";
import { canUseQualityMode, hasActiveBillingSubscription } from "@my-ai-orchestrator/payments";
import type { BillingPlanTier } from "../ai-policy/ai-policy-types.js";
import type { BackendProductServices } from "../../execution/service-types.js";
import type { BackendPublicGenerationRequest, BackendPublicGenerationService } from "./public-generation-types.js";

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
        const internalRequest = yield* toInternalPipelineRequest({
          ...request,
          ...sanitizedRequest
        }, options.services);
        const planTier = resolvePlanTier(request.userId, options.config, options.services);
        const executionSnapshot = yield* options.services.aiPolicy.resolveExecutionSnapshot({
          request: internalRequest,
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
          config: options.config,
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
          planId: options.config.billingPlanId ?? "free",
          model: internalRequest.model ?? `${options.config.serviceName}-${options.config.qualityMode}`,
          adapter: internalRequest.adapter ?? options.config.serviceName
        });

        return yield* options.execution.executeTrusted(executionSnapshot);
      });
    }
  };
}

function toInternalPipelineRequest(
  request: BackendPublicGenerationRequest,
  services: BackendProductServices
): Effect.Effect<PipelineRequest, BackendAIPolicyCatalogError> {
  const policyContentType = services.aiPolicy.listContentTypes().find((contentType) => contentType.id === request.contentType);
  if (!policyContentType) {
    return Effect.fail(
      new BackendAIPolicyCatalogError({
        policyVersion: "active",
        message: `No policy-governed content type found for "${request.contentType}"`
      })
    );
  }

  return Effect.succeed({
    userId: request.userId,
    pipelineType: policyContentType.pipelineType,
    contentType: request.contentType,
    briefing: request.briefing,
    importedContext: request.importedContext,
    context: request.context,
    language: request.language,
    qualityMode: request.qualityMode,
    model: request.model,
    quoteId: request.quoteId,
    previewRecommendation: request.previewRecommendation,
    includeTrace: request.includeTrace,
    idempotencyKey: request.idempotencyKey
  });
}

function resolvePlanTier(
  userId: string,
  config: BackendConfig,
  services: BackendProductServices
): BillingPlanTier {
  return (services.billing.getEntitlement(userId, config.billingPlanId)?.tier ?? "free") as BillingPlanTier;
}

function assertPublicGenerationAccess(args: {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
  readonly request: BackendPublicGenerationRequest;
  readonly pricing: {
    readonly contentType: string;
    readonly qualityMode: string;
    readonly creditPrice: number;
  };
}): Effect.Effect<void, BackendUsageAuthorizationError> {
  if (!args.config.billingPlanId) {
    return Effect.void;
  }

  const entitlement = args.services.billing.getEntitlement(args.request.userId, args.config.billingPlanId) ?? null;
  if (entitlement === null) {
    return Effect.fail(
      new BackendUsageAuthorizationError({
        userId: args.request.userId,
        planId: args.config.billingPlanId ?? "free",
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

  if (entitlement.wallet.availableCredits < args.pricing.creditPrice) {
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
