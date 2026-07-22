import { Effect } from "effect";
import type {
  ExecutionPlan,
  GenerationScope,
  PipelineDefinition,
  QualityMode,
  RhetoricalMode
} from "@my-ai-orchestrator/contracts";
import { BackendValidationError } from "../../http/errors.js";
import { planGeneration } from "./compositor/compositor-planner.js";
import { materializeCompositorPipeline } from "./compositor/plan-materializer.js";
import { formatPatchOp } from "./step-planner/format-patch-op.js";
import { patchExecutionPlan } from "./step-planner/step-planner.js";

// The dominant mode is inferred at the end of the generation questions (the /me/genre-inference
// producer, F4-7) and threaded onto the request. This default is the degrade path: an API caller — or
// a degraded inference — that sends no mode plans as expository prose.
const DEFAULT_RHETORICAL_MODE: RhetoricalMode = "expound";

export interface StepPlannerTelemetry {
  readonly patchCount: number;
  readonly ops: readonly string[];
  readonly basePlanSignature: ExecutionPlan["planSignature"];
  readonly finalPlanSignature: ExecutionPlan["planSignature"];
}

export interface ResolvedGenerationTarget {
  readonly contentTypeId: string;
  readonly compositor: {
    readonly plan: ExecutionPlan;
    readonly pipeline: PipelineDefinition;
  };
  readonly stepPlanner?: StepPlannerTelemetry;
}

function resolveCompositorPlan(args: {
  readonly basePlan: ExecutionPlan;
  readonly stepPlannerEnabled?: boolean;
  readonly briefing?: string | Record<string, unknown>;
}): {
  readonly plan: ExecutionPlan;
  readonly pipeline: PipelineDefinition;
  readonly stepPlanner?: StepPlannerTelemetry;
} {
  if (args.stepPlannerEnabled && args.briefing !== undefined) {
    const patched = patchExecutionPlan(args.basePlan, args.briefing);
    const plan = patched.plan;
    return {
      plan,
      pipeline: materializeCompositorPipeline(plan),
      stepPlanner: {
        patchCount: patched.ops.length,
        ops: patched.ops.map(formatPatchOp),
        basePlanSignature: patched.basePlanSignature,
        finalPlanSignature: plan.planSignature
      }
    };
  }

  return {
    plan: args.basePlan,
    pipeline: materializeCompositorPipeline(args.basePlan)
  };
}

export function resolveGenerationTarget(request: {
  readonly rhetoricalMode?: RhetoricalMode;
  readonly scope?: GenerationScope;
  readonly stepPlannerEnabled?: boolean;
  readonly briefing?: string | Record<string, unknown>;
  readonly qualityMode?: QualityMode;
}): Effect.Effect<ResolvedGenerationTarget, BackendValidationError> {
  if (!request.scope) {
    return Effect.fail(
      new BackendValidationError({
        message: "A generation scope (length tier and channel) is required"
      })
    );
  }

  const basePlan = planGeneration({
    rhetoricalMode: request.rhetoricalMode ?? DEFAULT_RHETORICAL_MODE,
    scope: request.scope,
    qualityMode: request.qualityMode ?? "balanced"
  });
  const { plan, pipeline, stepPlanner } = resolveCompositorPlan({
    basePlan,
    stepPlannerEnabled: request.stepPlannerEnabled,
    briefing: request.briefing
  });

  return Effect.succeed({
    contentTypeId: plan.planSignature,
    compositor: { plan, pipeline },
    ...(stepPlanner ? { stepPlanner } : {})
  });
}
