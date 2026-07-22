import type { CompositorMetadata, ExecutionTelemetry, GenerationChannel, PlanSignature } from "@my-ai-orchestrator/contracts";
import { isGenerationChannel } from "@my-ai-orchestrator/contracts";

// Backend-internal generation metadata rides inside PipelineRequest.context under these keys.
// This module owns the keys and the read guards so a duck-typed reader can't silently drift
// from the writer (merge-compositor-pipeline-context).
// ponytail: this telemetry is backend-only yet travels in the client-facing context bag; a
// typed backend-only carrier out of the contract is the deeper follow-up (architecture review C7).

export const PIPELINE_METADATA_KEYS = {
  compositor: "compositor",
  stepPlanner: "stepPlanner",
  rhetoricalMode: "rhetoricalMode",
  generationChannel: "generationChannel"
} as const;


const PLAN_SIGNATURES = new Set<PlanSignature>([
  "short-piece",
  "long-piece",
  "serial-piece",
  "edition-piece"
]);

function isPlanSignature(value: string): value is PlanSignature {
  return PLAN_SIGNATURES.has(value as PlanSignature);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

export function readCompositorMetadata(context: unknown): CompositorMetadata | undefined {
  const compositor = asRecord(context)?.[PIPELINE_METADATA_KEYS.compositor];
  return asRecord(compositor) as CompositorMetadata | undefined;
}

export function readStepPlannerTelemetry(context: unknown): ExecutionTelemetry["planner"] {
  const record = asRecord(asRecord(context)?.[PIPELINE_METADATA_KEYS.stepPlanner]);
  if (!record) {
    return undefined;
  }

  const { patchCount, ops, basePlanSignature, finalPlanSignature } = record;
  if (
    typeof patchCount !== "number" ||
    !Array.isArray(ops) ||
    ops.some((entry) => typeof entry !== "string") ||
    typeof basePlanSignature !== "string" ||
    typeof finalPlanSignature !== "string" ||
    !isPlanSignature(basePlanSignature) ||
    !isPlanSignature(finalPlanSignature)
  ) {
    return undefined;
  }

  return {
    patchCount,
    ops: [...ops],
    basePlanSignature,
    finalPlanSignature
  };
}

// The generation channel rides in the same context bag (written by merge-compositor-pipeline-context)
// and keys the Format Expression Profile (ADR 0010 F6-4). Unknown/absent → "unspecified" so a legacy
// or channel-less request degrades to the un-narrowed voice, never throws.
export function readGenerationChannel(context: unknown): GenerationChannel {
  const value = asRecord(context)?.[PIPELINE_METADATA_KEYS.generationChannel];
  return isGenerationChannel(value) ? value : "unspecified";
}
