import { Effect } from "effect";
import type {
  ExecutionPlan,
  GenerationIntent,
  GenerationScope,
  PipelineDefinition,
  QualityMode
} from "@my-ai-orchestrator/contracts";
import { BackendValidationError } from "../../http/errors.js";
import { planGeneration } from "./compositor/compositor-planner.js";
import { materializeCompositorPipeline } from "./compositor/plan-materializer.js";
import { resolveGenerationIntent, type ResolvedGenerationIntent } from "./intent-resolver.js";
import { patchExecutionPlan } from "./step-planner/step-planner.js";

export interface ResolvedGenerationTarget {
  readonly contentTypeId: string;
  readonly resolvedIntent?: ResolvedGenerationIntent;
  readonly ignoredLegacyContentType?: string;
  readonly compositor?: {
    readonly plan: ExecutionPlan;
    readonly pipeline: PipelineDefinition;
  };
}

function resolveCompositorPlan(args: {
  readonly basePlan: ExecutionPlan;
  readonly stepPlannerEnabled?: boolean;
  readonly briefing?: string | Record<string, unknown>;
}): { readonly plan: ExecutionPlan; readonly pipeline: PipelineDefinition } {
  if (args.stepPlannerEnabled && args.briefing !== undefined) {
    const patched = patchExecutionPlan(args.basePlan, args.briefing);
    const plan = patched.plan;
    return {
      plan,
      pipeline: materializeCompositorPipeline(plan)
    };
  }

  return {
    plan: args.basePlan,
    pipeline: materializeCompositorPipeline(args.basePlan)
  };
}

export function resolveGenerationTarget(request: {
  readonly intent?: GenerationIntent;
  readonly scope?: GenerationScope;
  readonly contentType?: string;
  readonly compositorEnabled?: boolean;
  readonly stepPlannerEnabled?: boolean;
  readonly briefing?: string | Record<string, unknown>;
  readonly qualityMode?: QualityMode;
}): Effect.Effect<ResolvedGenerationTarget, BackendValidationError> {
  if (request.intent && request.scope) {
    const resolved = resolveGenerationIntent({ intent: request.intent, scope: request.scope });

    if (request.compositorEnabled) {
      const basePlan = planGeneration({
        intent: request.intent,
        scope: request.scope,
        qualityMode: request.qualityMode ?? "balanced"
      });
      const { plan, pipeline } = resolveCompositorPlan({
        basePlan,
        stepPlannerEnabled: request.stepPlannerEnabled,
        briefing: request.briefing
      });
      const compositorResult: ResolvedGenerationTarget = {
        contentTypeId: plan.planSignature,
        resolvedIntent: resolved,
        compositor: { plan, pipeline }
      };

      if (request.contentType && request.contentType !== resolved.legacyContentTypeId) {
        return Effect.zipRight(
          Effect.logWarning("Ignoring legacy contentType in favor of compositor planning", {
            intent: request.intent,
            scope: request.scope,
            contentType: request.contentType,
            planSignature: plan.planSignature,
            resolvedContentType: resolved.legacyContentTypeId
          }),
          Effect.succeed({
            ...compositorResult,
            ignoredLegacyContentType: request.contentType
          })
        );
      }

      return Effect.succeed(compositorResult);
    }

    if (request.contentType && request.contentType !== resolved.legacyContentTypeId) {
      return Effect.zipRight(
        Effect.logWarning("Ignoring legacy contentType in favor of intent resolution", {
          intent: request.intent,
          scope: request.scope,
          contentType: request.contentType,
          resolvedContentType: resolved.legacyContentTypeId
        }),
        Effect.succeed({
          contentTypeId: resolved.legacyContentTypeId,
          resolvedIntent: resolved,
          ignoredLegacyContentType: request.contentType
        })
      );
    }

    return Effect.succeed({
      contentTypeId: resolved.legacyContentTypeId,
      resolvedIntent: resolved
    });
  }

  if (request.contentType) {
    return Effect.succeed({ contentTypeId: request.contentType });
  }

  return Effect.fail(
    new BackendValidationError({
      message: "Either intent and scope or contentType must be provided"
    })
  );
}
