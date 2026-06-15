import { Effect } from "effect";
import type { SyncRunResponse } from "@my-ai-orchestrator/contracts";
import type { BackendExecutionFailedError } from "../../http/errors.js";
import { createExecutionFailure } from "./execution-failure.js";
import type { ExecutePipelineOptions, RuntimeAttemptState, RuntimeSelectionContext } from "../runtime-types.js";
import { createBackendProviderTransport } from "./provider-transport.js";
import { createExecutionTelemetry, normalizeText } from "../quality/quality.js";
import { executeQualitySelectionAttempt } from "../quality/quality-candidate-selection.js";
import { laneCountForQualityMode } from "../quality/quality-lanes.js";

export function executeRuntimeAttemptLoop(
  options: ExecutePipelineOptions,
  context: RuntimeSelectionContext
): Effect.Effect<SyncRunResponse, BackendExecutionFailedError> {
  return Effect.gen(function* () {
    const providerTransport = options.providerTransport ?? createBackendProviderTransport(options.config);
    const initialState: RuntimeAttemptState = {
      lastScore: 0,
      executedLLMCalls: 0
    };

    const state = yield* Effect.reduce(context.attempts, initialState, (state, qualityMode) =>
      Effect.gen(function* () {
        if (state.lastResult && state.lastScore >= (context.controls.targetScore ?? 0)) {
          return state;
        }

        const laneCount = laneCountForQualityMode(qualityMode);
        const attemptBudget = options.plan.pipeline.steps.length * laneCount;
        if (state.executedLLMCalls + attemptBudget > (context.controls.maxLLMCalls ?? Number.POSITIVE_INFINITY)) {
          return state;
        }

        const attemptResult = yield* executeQualitySelectionAttempt({
          ...options,
          providerTransport,
          qualityMode,
          refinementEnabled: context.refinementEnabled,
          voice: context.voice,
          billingIdentity: context.billingIdentity,
          selection: {
            ...context.selection,
            qualityMode
          }
        });
        const executedLLMCalls = state.executedLLMCalls + attemptResult.attemptsUsed;

        return {
          lastScore: attemptResult.score,
          executedLLMCalls,
          lastResult: {
            mode: "sync",
            adapter: attemptResult.adapter,
            model: attemptResult.model,
            content: attemptResult.content,
            contentType: options.plan.contentType.id,
            pipelineName: options.plan.pipeline.name,
            qualityMode,
            controls: context.controls,
            telemetry: createExecutionTelemetry({
              executedCount: executedLLMCalls,
              maxLLMCalls: context.controls.maxLLMCalls ?? executedLLMCalls,
              inputTokensTotal: attemptResult.metrics.inputTokensTotal,
              outputTokensTotal: attemptResult.metrics.outputTokensTotal,
              debitedCredits: attemptResult.metrics.debitedCredits,
              estimatedUsdCost: attemptResult.metrics.estimatedUsdCost,
              selection: context.selection,
              request: options.request,
              finalQualityMode: qualityMode,
              pricingEnvelope: context.pricingEnvelope,
              providerAttempts: attemptResult.providerAttempts,
              billing: context.billingEnabled
                ? {
                    userId: context.billingIdentity.userId,
                    planId: context.billingIdentity.planId,
                    generationCycleId: context.billingIdentity.generationCycleId
                  }
                : undefined
            }),
            voice: context.voice?.metadata,
            trace: options.includeTrace ? attemptResult.trace : undefined,
            idempotencyKey: options.request.idempotencyKey
          } satisfies SyncRunResponse
        };
      })
    );

    if (!state.lastResult) {
      return yield* Effect.fail(
        createExecutionFailure({
          message: `Execution pipeline "${options.plan.pipeline.name}" completed without producing a final result`,
          reason: "runtime_empty_result"
        })
      );
    }

    return {
      ...state.lastResult,
      content: normalizeText(state.lastResult.content),
      controls: {
        ...context.controls,
        targetScore: context.controls.targetScore ?? state.lastScore
      },
      telemetry: {
        ...state.lastResult.telemetry,
        selection: {
          reason: context.selection.reason,
          adapter: context.selection.adapter,
          model: context.selection.model
        },
        billing: context.billingEnabled
          ? {
              userId: context.billingIdentity.userId,
              planId: context.billingIdentity.planId,
              generationCycleId: context.billingIdentity.generationCycleId
            }
          : undefined
      },
      voice: context.voice?.metadata
    };
  });
}
