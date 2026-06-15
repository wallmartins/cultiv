import { Effect } from "effect";
import { swallowWithDiagnostic } from "../../effects/non-blocking-diagnostics.js";
import type { JobProgress } from "@my-ai-orchestrator/contracts";
import type { Pipeline as RuntimePipeline, PipelineStep, RetryPolicy } from "@my-ai-orchestrator/core";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import type { ProgressCallbackResult } from "./pipeline-attempt-types.js";

export function createProgressSnapshot(stepIndex: number, totalSteps: number, currentStep: string): JobProgress {
  const percent = totalSteps <= 0 ? 0 : Math.round(((stepIndex + 1) / totalSteps) * 100);
  return {
    currentStep,
    stepIndex,
    totalSteps,
    percent
  };
}

export function createRuntimePipeline(
  plan: OrchestrationPlan,
  runtimeInputs: Readonly<Record<string, unknown>>
): RuntimePipeline {
  const hasSanitize = plan.pipeline.steps.some((s) => s.name === "sanitize");
  const steps = hasSanitize
    ? plan.pipeline.steps
    : [...plan.pipeline.steps, { name: "sanitize", skill: "sanitize" }];

  return {
    ...plan.pipeline,
    type: plan.pipelineType ?? undefined,
    inputs: { ...runtimeInputs },
    config: {
      adapter: plan.request.contentTypeId,
      refinementLoop: {
        enabled: true,
        maxIterations: 3,
        minImprovementDelta: 2,
        targetScore: 80,
        earlyExitOnConvergence: true
      }
    },
    steps: steps.map((step) => toRuntimeStep(step))
  };
}

export function createInitialState(
  plan: OrchestrationPlan,
  selection: {
    readonly adapter: string;
    readonly model: string;
    readonly qualityMode: "fast" | "balanced" | "strict";
  },
  runtimeInputs: Readonly<Record<string, unknown>>
): Record<string, unknown> {
  return {
    contentType: plan.contentType.id,
    pipelineName: plan.pipeline.name,
    topic:
      typeof runtimeInputs.briefing === "object" && runtimeInputs.briefing !== null
        ? (runtimeInputs.briefing as Record<string, unknown>).topic
        : typeof runtimeInputs.briefing === "string"
          ? runtimeInputs.briefing
          : typeof runtimeInputs.topic === "string"
            ? runtimeInputs.topic
          : plan.contentType.id,
    adapter: selection.adapter,
    model: selection.model,
    qualityMode: selection.qualityMode,
    __score: 0
  };
}

export function resolveRetryPolicy(qualityMode: "fast" | "balanced" | "strict"): RetryPolicy {
  if (qualityMode === "fast") {
    return {
      maxAttempts: 1,
      backoff: "fixed" as const,
      delayMs: 0
    };
  }

  if (qualityMode === "strict") {
    return {
      maxAttempts: 3,
      backoff: "exponential" as const,
      delayMs: 0
    };
  }

  return {
    maxAttempts: 2,
    backoff: "fixed" as const,
    delayMs: 0
  };
}

export function resolveStepExecutionType(step: OrchestrationPlan["pipeline"]["steps"][number] | PipelineStep): "local" | "llm" {
  const executionType = "config" in step && step.config && typeof step.config === "object"
    ? (step.config as Record<string, unknown>).executionType
    : undefined;

  return executionType === "local" || executionType === "llm" ? executionType : "llm";
}

export function resolveStepProviderModelPlan(
  step: OrchestrationPlan["pipeline"]["steps"][number] | PipelineStep,
  fallback: {
    readonly provider: string;
    readonly model: string;
  }
): ReadonlyArray<{
  readonly provider: string;
  readonly model: string;
}> {
  const resolvedPlan = "config" in step && step.config && typeof step.config === "object"
    ? (step.config as Record<string, unknown>).resolvedProviderModelPlan
    : undefined;

  if (Array.isArray(resolvedPlan) && resolvedPlan.length > 0) {
    return resolvedPlan.flatMap((attempt) => {
      if (!attempt || typeof attempt !== "object") {
        return [];
      }

      const provider = (attempt as Record<string, unknown>).provider;
      const model = (attempt as Record<string, unknown>).model;

      return typeof provider === "string" && typeof model === "string"
        ? [{ provider, model }]
        : [];
    });
  }

  return [fallback];
}

export function runProgressCallback(result: ProgressCallbackResult | undefined): Effect.Effect<void, never> {
  if (!result) {
    return Effect.void;
  }

  if (Effect.isEffect(result)) {
    return result;
  }

  if (typeof (result as Promise<void>)?.then === "function") {
    return Effect.tryPromise({
      try: () => result as Promise<void>,
      catch: () => undefined
    }).pipe(Effect.catchAll(swallowWithDiagnostic({
      operation: "Progress callback promise failed"
    })));
  }

  return Effect.void;
}

function toRuntimeStep(step: OrchestrationPlan["pipeline"]["steps"][number]): PipelineStep {
  return {
    ...step,
    retry: resolveRetryPolicy("balanced")
  };
}
