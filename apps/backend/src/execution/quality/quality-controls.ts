import type { QualityMode } from "@my-ai-orchestrator/contracts";

export interface ExecutionControls {
  readonly qualityMode?: QualityMode;
  readonly targetScore?: number;
  readonly maxIterations?: number;
  readonly minImprovementDelta?: number;
  readonly maxLLMCalls?: number;
}

export function createExecutionControls(qualityMode: QualityMode, stepCount: number): ExecutionControls {
  if (qualityMode === "fast") {
    return {
      qualityMode,
      targetScore: 58,
      maxIterations: 1,
      minImprovementDelta: 5,
      maxLLMCalls: Math.max(1, stepCount)
    };
  }

  if (qualityMode === "strict") {
    return {
      qualityMode,
      targetScore: 88,
      maxIterations: 3,
      minImprovementDelta: 2,
      maxLLMCalls: Math.max(1, stepCount * 3)
    };
  }

  return {
    qualityMode,
    targetScore: 74,
    maxIterations: 2,
    minImprovementDelta: 3,
    maxLLMCalls: Math.max(1, stepCount * 2)
  };
}
