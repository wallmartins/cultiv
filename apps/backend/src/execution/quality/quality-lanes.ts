import { Effect } from "effect";
import type { QualityLane } from "@my-ai-orchestrator/text-quality";
import { buildQualityLanes } from "@my-ai-orchestrator/orchestrator";
import { CandidateGenerationError } from "@my-ai-orchestrator/text-quality";
import {
  executePipelineAttempt,
  type ExecutePipelineAttemptArgs,
  type ExecutePipelineAttemptResult
} from "../pipeline/pipeline-attempt.js";

export function buildRuntimeQualityLanes(
  options: ExecutePipelineAttemptArgs,
  laneCount: number,
  candidateRuns: Map<string, ExecutePipelineAttemptResult>
): readonly QualityLane[] {
  const baseLanes = buildQualityLanes(options.plan.pipeline, {
    laneCount,
    adapter: options.selection.adapter,
    model: options.selection.model,
    baseTemperature: baseTemperatureForQualityMode(options.qualityMode)
  });

  return baseLanes.map((lane) => {
    const laneQualityMode = strategyToQualityMode(lane.strategy);
    const laneModel = `${options.selection.model}:${lane.strategy}`;

    return {
      ...lane,
      model: laneModel,
      generate: () =>
        executePipelineAttempt({
          ...options,
          qualityMode: laneQualityMode,
          selection: {
            ...options.selection,
            qualityMode: laneQualityMode,
            model: laneModel
          },
          persistMemory: false
        }).pipe(
          Effect.tap((attemptResult) =>
            Effect.sync(() => {
              candidateRuns.set(lane.laneId, attemptResult);
            })
          ),
          Effect.map((attemptResult) => attemptResult.content),
          Effect.mapError(
            (error) =>
              new CandidateGenerationError({
                laneId: lane.laneId,
                message:
                  error instanceof Error
                    ? error.message
                    : `Candidate generation failed for lane "${lane.laneId}"`
              })
          )
        )
    };
  });
}

export function laneCountForQualityMode(qualityMode: "fast" | "balanced" | "strict"): number {
  if (qualityMode === "strict") {
    return 3;
  }

  if (qualityMode === "balanced") {
    return 2;
  }

  return 1;
}

function baseTemperatureForQualityMode(qualityMode: "fast" | "balanced" | "strict"): number {
  if (qualityMode === "strict") {
    return 0.6;
  }

  if (qualityMode === "balanced") {
    return 0.4;
  }

  return 0.2;
}

function strategyToQualityMode(strategy: "conservative" | "balanced" | "creative"): "fast" | "balanced" | "strict" {
  if (strategy === "creative") {
    return "strict";
  }

  if (strategy === "balanced") {
    return "balanced";
  }

  return "fast";
}
