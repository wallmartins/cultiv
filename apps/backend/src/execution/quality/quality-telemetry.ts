import type { PipelineRequest, QualityMode } from "@my-ai-orchestrator/contracts";
import type { ResolvedPricingEnvelope } from "../../product/ai-policy/ai-policy-types.js";
import type { BackendStepProviderAttempt } from "../pipeline/pipeline-attempt-types.js";
import type { ExecutionSelection } from "./quality-selection.js";
import { resolveExecutionPreviewCorrelation } from "../pipeline/preview-correlation.js";

export interface ExecutionTelemetry {
  readonly llm?: {
    readonly executedCount: number;
    readonly bypassedCount: number;
    readonly llmCallsSaved: number;
    readonly bypassRate: number;
  };
  readonly cost?: {
    readonly inputTokensTotal: number;
    readonly outputTokensTotal: number;
    readonly estimatedUsdCost: number;
    readonly debitedCredits: number;
  };
  readonly selection?: {
    readonly reason: string;
    readonly adapter: string;
    readonly model: string;
  };
  readonly preview?: {
    readonly quoteId?: string;
    readonly recommendedQualityMode?: QualityMode;
    readonly finalQualityMode: QualityMode;
    readonly divergedFromRecommendation: boolean;
    readonly recommendationReasonCodes: readonly string[];
  };
  readonly pricing?: {
    readonly quoteId?: string;
    readonly policyVersion?: string;
    readonly contentType?: string;
    readonly plannedCreditPrice?: number;
    readonly observedDebitedCredits: number;
    readonly observedUsdCost: number;
  };
  readonly providers?: {
    readonly finalProvider: string;
    readonly finalModel: string;
    readonly attempts: readonly BackendStepProviderAttempt[];
  };
  readonly billing?: {
    readonly userId: string;
    readonly planId: string;
    readonly generationCycleId: string;
  };
}

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
  const estimatedUsdCost =
    options.estimatedUsdCost ??
    roundEstimatedCost(
      (options.inputTokensTotal ?? 0) * 0.000004 + (options.outputTokensTotal ?? 0) * 0.000015
    );
  const preview = options.request && options.finalQualityMode
    ? resolveExecutionPreviewCorrelation({
        request: options.request,
        finalQualityMode: options.finalQualityMode
      })
    : undefined;
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
    pricing: options.pricingEnvelope || preview
      ? {
          quoteId: preview?.quoteId,
          policyVersion: options.pricingEnvelope?.policyVersion,
          contentType: options.pricingEnvelope?.contentType,
          plannedCreditPrice: options.pricingEnvelope?.creditPrice,
          observedDebitedCredits,
          observedUsdCost: estimatedUsdCost
        }
      : undefined,
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

function roundEstimatedCost(value: number): number {
  return Math.round(value * 10000) / 10000;
}
