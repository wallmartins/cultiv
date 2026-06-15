import type { ExecutionMode, PipelineRequest, QualityMode } from "@my-ai-orchestrator/contracts";

const QUALITY_MODE_ORDER: readonly QualityMode[] = ["fast", "balanced", "strict"];

export interface ExecutionSelection {
  readonly adapter: string;
  readonly model: string;
  readonly qualityMode: QualityMode;
  readonly reason: "request" | "default";
}

export function resolveSelection(
  request: PipelineRequest,
  fallback: {
    readonly executionMode: ExecutionMode;
    readonly qualityMode: QualityMode;
    readonly adapter: string;
    readonly model: string;
  }
): ExecutionSelection {
  const hasRequestedQualityMode = "qualityMode" in request && Boolean(request.qualityMode);
  const hasRequestedAdapter = "adapter" in request && Boolean(request.adapter);
  const hasRequestedModel = "model" in request && Boolean(request.model);
  const qualityMode: QualityMode = hasRequestedQualityMode && request.qualityMode ? request.qualityMode : fallback.qualityMode;
  const adapter: string = hasRequestedAdapter && request.adapter ? request.adapter : fallback.adapter;
  const model: string = hasRequestedModel && request.model ? request.model : `${adapter}-${qualityMode}`;

  return {
    adapter,
    model,
    qualityMode,
    reason: hasRequestedAdapter || hasRequestedModel || hasRequestedQualityMode ? "request" : "default"
  };
}

export function buildQualityModeAttempts(initial: QualityMode): QualityMode[] {
  const startIndex = QUALITY_MODE_ORDER.indexOf(initial);
  if (startIndex === -1) {
    return ["balanced", "strict"];
  }

  return QUALITY_MODE_ORDER.slice(startIndex);
}

export function buildQualityAttempts(initial: QualityMode, maxIterations: number): QualityMode[] {
  return buildQualityModeAttempts(initial).slice(0, Math.max(1, maxIterations));
}
