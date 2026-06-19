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

export interface ResolvedGenerationTarget {
  readonly contentTypeId: string;
  readonly resolvedIntent?: ResolvedGenerationIntent;
  readonly ignoredLegacyContentType?: string;
  readonly compositor?: {
    readonly plan: ExecutionPlan;
    readonly pipeline: PipelineDefinition;
  };
}

export function resolveGenerationTarget(request: {
  readonly intent?: GenerationIntent;
  readonly scope?: GenerationScope;
  readonly contentType?: string;
  readonly compositorEnabled?: boolean;
  readonly qualityMode?: QualityMode;
}): Effect.Effect<ResolvedGenerationTarget, BackendValidationError> {
  if (request.intent && request.scope) {
    const resolved = resolveGenerationIntent({ intent: request.intent, scope: request.scope });

    if (request.compositorEnabled) {
      const plan = planGeneration({
        intent: request.intent,
        scope: request.scope,
        qualityMode: request.qualityMode ?? "balanced"
      });
      const pipeline = materializeCompositorPipeline(plan);
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
