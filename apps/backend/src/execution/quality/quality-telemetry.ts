import type { ExecutionTelemetry, PipelineRequest, QualityMode } from "@my-ai-orchestrator/contracts";
import type { ResolvedPricingEnvelope } from "../../product/ai-policy/ai-policy-types.js";
import { resolveCompositorPricingKeys } from "../../product/ai-policy/ai-policy-resolution.js";
import type { BackendStepProviderAttempt } from "../pipeline/pipeline-attempt-types.js";
import type { ExecutionSelection } from "./quality-selection.js";
import { resolveExecutionPreviewCorrelation } from "../pipeline/preview-correlation.js";
import { readCompositorMetadata, readStepPlannerTelemetry } from "../pipeline-metadata.js";
import { estimateUsdCost } from "../cost/model-rates.js";

export type { ExecutionTelemetry };

export function createExecutionTelemetry(options: {
  readonly executedCount: number;
  readonly maxLLMCalls: number;
  readonly inputTokensTotal?: number;
  readonly outputTokensTotal?: number;
  readonly debitedCredits?: number;
  readonly estimatedUsdCost?: number;
  readonly selection?: ExecutionSelection;
  readonly request?: PipelineRequest;
  readonly finalQualityMode?: QualityMode;
  readonly pricingEnvelope?: ResolvedPricingEnvelope;
  readonly providerAttempts?: readonly BackendStepProviderAttempt[];
  readonly billing?: {
    readonly userId: string;
    readonly planId: string;
    readonly generationCycleId: string;
  };
}): ExecutionTelemetry {
  const boundedExecutedCount = Math.max(0, options.executedCount);
  const boundedBudget = Math.max(0, options.maxLLMCalls);
  const bypassedCount = Math.max(0, boundedBudget - boundedExecutedCount);
  // Caminho normal: soma dos custos por passo, já resolvidos pelo modelo que atendeu cada
  // chamada. O fallback abaixo só vale quando não houve métrica por passo — aí usa o modelo
  // selecionado, e sem seleção cai no teto conservador de model-rates.
  const estimatedUsdCost =
    options.estimatedUsdCost ??
    estimateUsdCost({
      provider: options.selection?.adapter ?? "unknown",
      model: options.selection?.model ?? "unknown",
      inputTokens: options.inputTokensTotal ?? 0,
      outputTokens: options.outputTokensTotal ?? 0
    });
  const preview = options.request && options.finalQualityMode
    ? resolveExecutionPreviewCorrelation({
        request: options.request,
        finalQualityMode: options.finalQualityMode
      })
    : undefined;
  const compositorTelemetry = resolveCompositorTelemetryContext(options.request, options.pricingEnvelope);
  const plannerTelemetry = extractStepPlannerTelemetry(options.request);
  const providerAttempts = options.providerAttempts ? [...options.providerAttempts] : [];
  const finalProviderAttempt = [...providerAttempts].reverse().find((attempt) => attempt.status === "succeeded");
  const observedDebitedCredits = Math.max(0, options.debitedCredits ?? 0);

  return {
    llm: {
      executedCount: boundedExecutedCount,
      bypassedCount,
      llmCallsSaved: bypassedCount,
      bypassRate: boundedBudget === 0 ? 0 : bypassedCount / boundedBudget
    },
    cost: {
      inputTokensTotal: Math.max(0, options.inputTokensTotal ?? 0),
      outputTokensTotal: Math.max(0, options.outputTokensTotal ?? 0),
      estimatedUsdCost,
      debitedCredits: Math.max(0, options.debitedCredits ?? 0)
    },
    selection: options.selection
      ? {
          reason: options.selection.reason,
          adapter: options.selection.adapter,
          model: options.selection.model
        }
      : undefined,
    preview: preview
      ? {
          quoteId: preview.quoteId,
          recommendedQualityMode: preview.recommendedQualityMode,
          finalQualityMode: preview.finalQualityMode,
          divergedFromRecommendation: preview.divergedFromRecommendation,
          recommendationReasonCodes: [...preview.recommendationReasonCodes]
        }
      : undefined,
    pricing: options.pricingEnvelope || preview || compositorTelemetry.pricing
      ? {
          quoteId: preview?.quoteId,
          policyVersion: options.pricingEnvelope?.policyVersion,
          contentType: options.pricingEnvelope?.contentType,
          planSignature:
            options.pricingEnvelope?.planSignature ?? compositorTelemetry.pricing?.planSignature,
          lengthTier: options.pricingEnvelope?.lengthTier ?? compositorTelemetry.pricing?.lengthTier,
          plannedCreditPrice: options.pricingEnvelope?.creditPrice,
          observedDebitedCredits,
          observedUsdCost: estimatedUsdCost
        }
      : undefined,
    compositor: compositorTelemetry.compositor,
    planner: plannerTelemetry,
    providers: finalProviderAttempt
      ? {
          finalProvider: finalProviderAttempt.provider,
          finalModel: finalProviderAttempt.model,
          attempts: providerAttempts
        }
      : undefined,
    billing: options.billing
  };
}

function resolveCompositorTelemetryContext(
  request: PipelineRequest | undefined,
  pricingEnvelope: ResolvedPricingEnvelope | undefined
): {
  readonly pricing?: {
    readonly planSignature?: string;
    readonly lengthTier?: string;
  };
  readonly compositor?: {
    readonly planId: string;
  };
} {
  if (!request) {
    return {
      pricing:
        pricingEnvelope?.planSignature || pricingEnvelope?.lengthTier
          ? {
              planSignature: pricingEnvelope.planSignature,
              lengthTier: pricingEnvelope.lengthTier
            }
          : undefined
    };
  }

  const compositorPricing = resolveCompositorPricingKeys(request);
  const compositorMetadata = extractCompositorPlanId(request);

  return {
    pricing:
      compositorPricing.planSignature || compositorPricing.lengthTier
        ? {
            planSignature: compositorPricing.planSignature,
            lengthTier: compositorPricing.lengthTier
          }
        : undefined,
    compositor: compositorMetadata?.planId ? { planId: compositorMetadata.planId } : undefined
  };
}

function extractCompositorPlanId(
  request: PipelineRequest
): { readonly planId?: string } | undefined {
  const compositor = readCompositorMetadata("context" in request ? request.context : undefined);
  if (!compositor) {
    return undefined;
  }

  return typeof compositor.planId === "string" ? { planId: compositor.planId } : undefined;
}

function extractStepPlannerTelemetry(
  request: PipelineRequest | undefined
): ExecutionTelemetry["planner"] {
  return readStepPlannerTelemetry(request && "context" in request ? request.context : undefined);
}
