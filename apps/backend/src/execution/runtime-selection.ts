import { Effect } from "effect";
import type { BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { BackendExecutionFailedError } from "../http/errors.js";
import type { ExecutePipelineOptions, RuntimeSelectionContext } from "./runtime-types.js";
import { resolveBackendBillingIdentity } from "./billing.js";
import { normalizeExecutionFailure } from "./pipeline/execution-failure.js";
import {
  buildQualityAttempts,
  createExecutionControls,
  resolveSelection
} from "./quality/quality.js";
import { laneCountForQualityMode } from "./quality/quality-lanes.js";

export function resolveRuntimeSelectionContext(options: ExecutePipelineOptions): Effect.Effect<RuntimeSelectionContext, BackendExecutionFailedError> {
  return Effect.gen(function* () {
  const billingIdentity = resolveBackendBillingIdentity(
    options.request,
    options.config,
    `generation:${options.plan.pipeline.name}:${options.request.idempotencyKey ?? "anonymous"}`
  );
  const selection = resolveSelection(options.request, {
    executionMode: options.config.executionMode,
    qualityMode: options.config.qualityMode,
    adapter: options.config.serviceName,
    model: `${options.config.serviceName}-${options.config.qualityMode}`
  });
  const controls = createExecutionControls(selection.qualityMode, options.plan.pipeline.steps.length);
  const attempts = buildQualityAttempts(selection.qualityMode, controls.maxIterations ?? 1);
  const billingEnabled = !options.simulateCredits && Boolean(options.config.billingPlanId);
  const billing = options.services.billing;
  const pricingEnvelope = options.pricingEnvelope ?? (billingEnabled
    ? yield* options.services.aiPolicy.resolvePricingEnvelope({
        planTier: (billing.getEntitlement(billingIdentity.userId, billingIdentity.planId)?.tier ?? "free"),
        contentType: options.plan.contentType.id,
        qualityMode: selection.qualityMode,
        attachedPolicyVersion: options.config.aiPolicyAttachedVersion
      })
    : undefined);
  const debitedCreditsEstimate = billingEnabled
    ? estimateDebitForAttempts(billing, selection.qualityMode, attempts.length, pricingEnvelope?.creditPrice)
    : 0;
  const planEntitlement = billingEnabled
    ? billing.getEntitlement(billingIdentity.userId, billingIdentity.planId) ?? null
    : null;
  const refinementFlagEnabled = options.services.featureFlags.isEnabled("content.language.refinement", {
    environment: options.config.environment,
    contentType: options.plan.contentType.id,
    userId: billingIdentity.userId
  });
  const refinementEnabled =
    refinementFlagEnabled && (planEntitlement === null || planEntitlement.canRefine);
  const voice = yield* options.services.voice.resolveEffectiveVoice(
    billingIdentity.userId,
    {
      contentType: options.plan.contentType.id,
      requestedLanguage: options.request.language ?? options.plan.contentType.defaultLanguage
    }
  );

  return {
    billingIdentity,
    selection,
    controls,
    attempts,
    billingEnabled,
    debitedCreditsEstimate,
    pricingEnvelope,
    refinementEnabled,
    voice: voice ?? undefined
  };
  }).pipe(
    Effect.catchAll((error) =>
      Effect.fail(
        normalizeExecutionFailure(error, {
          message: `Failed to resolve runtime selection context for pipeline "${options.plan.pipeline.name}"`,
          reason: "unexpected_execution_failure"
        })
      )
    )
  );
}

function estimateDebitForAttempts(
  billing: BillingServiceContract,
  qualityMode: "fast" | "balanced" | "strict",
  attemptsCount: number,
  creditPriceOverride?: number
): number {
  if (creditPriceOverride !== undefined) {
    return creditPriceOverride;
  }

  return billing.quoteDebitForMode(
    qualityMode,
    Math.max(0, attemptsCount - 1) * laneCountForQualityMode(qualityMode)
  );
}
