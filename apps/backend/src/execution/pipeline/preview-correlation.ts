import type { PipelineRequest, PreviewRecommendation, QualityMode } from "@my-ai-orchestrator/contracts";

export interface ExecutionPreviewCorrelation {
  readonly quoteId?: string;
  readonly recommendedQualityMode?: QualityMode;
  readonly finalQualityMode: QualityMode;
  readonly divergedFromRecommendation: boolean;
  readonly recommendationReasonCodes: readonly string[];
}

export function resolveExecutionPreviewCorrelation(args: {
  readonly request: PipelineRequest;
  readonly finalQualityMode: QualityMode;
}): ExecutionPreviewCorrelation | undefined {
  const quoteId = "quoteId" in args.request && typeof args.request.quoteId === "string"
    ? args.request.quoteId
    : undefined;
  const previewRecommendation = "previewRecommendation" in args.request
    ? args.request.previewRecommendation
    : undefined;

  if (!quoteId && !previewRecommendation) {
    return undefined;
  }

  return {
    quoteId,
    recommendedQualityMode: previewRecommendation?.qualityMode,
    finalQualityMode: args.finalQualityMode,
    divergedFromRecommendation: hasRecommendationDiverged(previewRecommendation, args.finalQualityMode),
    recommendationReasonCodes: previewRecommendation ? [...previewRecommendation.reasonCodes] : []
  };
}

export function toPreviewCorrelationTracePayload(correlation: ExecutionPreviewCorrelation): Record<string, unknown> {
  return {
    quoteId: correlation.quoteId,
    recommendedQualityMode: correlation.recommendedQualityMode,
    finalQualityMode: correlation.finalQualityMode,
    divergedFromRecommendation: correlation.divergedFromRecommendation,
    recommendationReasonCodes: [...correlation.recommendationReasonCodes]
  };
}

function hasRecommendationDiverged(
  previewRecommendation: PreviewRecommendation | undefined,
  finalQualityMode: QualityMode
): boolean {
  return previewRecommendation ? previewRecommendation.qualityMode !== finalQualityMode : false;
}
