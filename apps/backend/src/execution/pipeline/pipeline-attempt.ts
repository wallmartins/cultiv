import { Effect } from "effect";
import { ContextManagerService, TraceRecorderService, createContextManagerLayer, createTraceRecorderLayer } from "@my-ai-orchestrator/core";
import { runStepWithRetries } from "@my-ai-orchestrator/orchestrator";
import type { BackendExecutionFailedError } from "../../http/errors.js";
import { filterLexiconForDomain } from "../../product/voice/voice-hints.js";
import { resolveGenerationRuntimeContext } from "./generation-runtime.js";
import { createBackendSkillDefinition } from "../skills.js";
import { createExecutionFailure, normalizeExecutionFailure } from "./execution-failure.js";
import { estimateStepProgressScore } from "../quality/quality.js";
import { createBackendExecutionAdapter } from "./pipeline-execution-adapter.js";
import { filterConfiguredProviderAttempts } from "./provider-availability.js";
import { evaluateLanguageGate } from "./pipeline-language-gate.js";
import {
  resolveExecutionPreviewCorrelation,
  toPreviewCorrelationTracePayload
} from "./preview-correlation.js";
import {
  createInitialState,
  createProgressSnapshot,
  createRuntimePipeline,
  resolveRetryPolicy,
  resolveStepProviderModelPlan,
  resolveStepExecutionType,
  runProgressCallback
} from "./pipeline-runtime-state.js";
import { attachResolvedStepScopeContracts, createScopedContextManager } from "../../safety/step-scope.js";
import {
  resolveSanitizedGenerationInput,
  toRuntimeInputRecord
} from "./sanitized-generation-input.js";
import type {
  BackendAdapterMetrics,
  ExecutePipelineAttemptArgs,
  ExecutePipelineAttemptResult,
  ExecutePipelineOptions,
  ProgressCallbackResult
} from "./pipeline-attempt-types.js";

export type {
  BackendAdapterMetrics,
  ExecutePipelineAttemptArgs,
  ExecutePipelineAttemptResult,
  ExecutePipelineOptions,
  ProgressCallbackResult
} from "./pipeline-attempt-types.js";

export function executePipelineAttempt(
  options: ExecutePipelineAttemptArgs
): Effect.Effect<ExecutePipelineAttemptResult, BackendExecutionFailedError> {
  const sanitizedInput = resolveSanitizedGenerationInput(options.request, options.plan);
  const runtimeInputs = toRuntimeInputRecord(sanitizedInput);
  const runtimePipeline = attachResolvedStepScopeContracts(
    createRuntimePipeline(options.plan, runtimeInputs),
    runtimeInputs
  );
  const generationContext = resolveGenerationRuntimeContext({
    contentType: options.plan.contentType.id,
    inputs: runtimeInputs
  });
  const voiceHints = options.voice?.voiceHints
    ? {
        ...options.voice.voiceHints,
        lexicon: filterLexiconForDomain(options.voice.voiceHints.lexicon ?? [], generationContext.domain)
      }
    : undefined;
  const runtimeState = {
    ...createInitialState(options.plan, options.selection, runtimeInputs),
    generationContext,
    voiceProfile: voiceHints
  };

  const contextLayer = createContextManagerLayer({
    pipeline: runtimePipeline,
    inputs: runtimeInputs,
    initialState: runtimeState
  });
  const traceLayer = createTraceRecorderLayer(runtimePipeline, runtimeInputs, options.selection.adapter);

  return Effect.gen(function* () {
    const contextManager = yield* ContextManagerService;
    const traceRecorder = yield* TraceRecorderService;
    let attemptsUsed = 0;
    const metrics: BackendAdapterMetrics = {
      inputTokensTotal: 0,
      outputTokensTotal: 0,
      debitedCredits: 0,
      estimatedUsdCost: 0
    };
    const previewCorrelation = resolveExecutionPreviewCorrelation({
      request: options.request,
      finalQualityMode: options.selection.qualityMode
    });
    const providerAttempts: Array<ExecutePipelineAttemptResult["providerAttempts"][number]> = [];

    if (previewCorrelation) {
      yield* traceRecorder.recordEvent({
        type: "preview-correlation",
        payload: toPreviewCorrelationTracePayload(previewCorrelation)
      });
    }

    for (const [stepIndex, step] of runtimePipeline.steps.entries()) {
      attemptsUsed += 1;
      const skill = createBackendSkillDefinition(step, {
        request: options.request,
        adapter: options.selection.adapter,
        model: options.selection.model,
        qualityMode: options.selection.qualityMode
      });
      const scopedContextManager = createScopedContextManager({
        contextManager,
        pipeline: runtimePipeline,
        stepIndex,
        policyEvidence: options.services.policyEvidence
      });
      const adapter = resolveStepExecutionType(step) === "llm" && step.name !== "sanitize"
        ? createBackendExecutionAdapter({
            attempts: filterConfiguredProviderAttempts(
              options.config,
              resolveStepProviderModelPlan(step, {
                provider: options.selection.adapter,
                model: options.selection.model
              })
            ),
            qualityMode: options.selection.qualityMode,
            aiAdapters: options.services.aiAdapters,
            providerTransport: options.providerTransport,
            onAttemptEvent: (event) =>
              traceRecorder.recordEvent({
                type: "provider-attempt",
                stepIndex,
                stepName: step.name,
                skill: step.skill,
                attempt: event.attemptIndex,
                status: event.status,
                payload: {
                  provider: event.provider,
                  model: event.model,
                  path: event.path,
                  totalAttempts: event.totalAttempts,
                  error: event.error
                }
              })
          })
        : undefined;
      const result = yield* runStepWithRetries({
        step,
        stepIndex,
        contextManager: scopedContextManager,
        traceRecorder,
        skill,
        retryPolicy: resolveRetryPolicy(options.selection.qualityMode),
        adapter
      });

      if (!result.success) {
        const trace = yield* traceRecorder.getTrace();
        const failureReason = resolveStepFailureReason(trace, step.name);
        return yield* Effect.fail(
          createExecutionFailure({
            message: `Pipeline "${options.plan.pipeline.name}" failed at step "${step.name}": ${failureReason}`,
            reason: "pipeline_step_failed"
          })
        );
      }

      if (adapter) {
        const inspection = adapter.inspect();
        const stepMetrics = inspection.metrics;
        metrics.inputTokensTotal += stepMetrics.inputTokensTotal;
        metrics.outputTokensTotal += stepMetrics.outputTokensTotal;
        metrics.debitedCredits += stepMetrics.debitedCredits;
        metrics.estimatedUsdCost += stepMetrics.estimatedUsdCost;
        providerAttempts.push(
          ...inspection.attempts.map((attempt) => ({
            ...attempt,
            stepIndex,
            stepName: step.name
          }))
        );
      }

      const contextState = yield* contextManager.getState();
      const stepOutput = contextState[step.name];
      if (typeof stepOutput === "string" && options.refinementEnabled) {
        const languageGate = yield* evaluateLanguageGate(
          stepOutput,
          sanitizedInput.language,
          options.plan
        );
        yield* traceRecorder.recordLanguageGateResult(languageGate);
        if (!languageGate.passed) {
          const violations = languageGate.errors.length > 0
            ? languageGate.errors.join(", ")
            : languageGate.warnings.length > 0
              ? languageGate.warnings.join(", ")
              : "language gate blocked the generated text";
          return yield* Effect.fail(
            createExecutionFailure({
              message: `Language gate blocked output from step "${step.name}" in pipeline "${options.plan.pipeline.name}": ${violations}`,
              reason: "language_gate_failed"
            })
          );
        }
        yield* contextManager.set(
          "__score",
          estimateStepProgressScore(stepOutput, options.plan.pipeline.steps.length, options.selection.qualityMode)
        );
      } else if (typeof stepOutput === "string") {
        yield* traceRecorder.recordLanguageGateResult({
          passed: true,
          errors: [],
          warnings: []
        });
      }

      yield* runProgressCallback(
        options.onProgress?.(createProgressSnapshot(stepIndex, runtimePipeline.steps.length, step.name))
      );
      yield* contextManager.advanceStep();
    }

    const contextState = yield* contextManager.getState();
    const finalStepName = runtimePipeline.steps.at(-1)?.name;
    const output = finalStepName ? contextState[finalStepName] : contextState.content;
    const content = typeof output === "string" ? output : JSON.stringify(output ?? contextState);
    const trace = yield* traceRecorder.complete("completed");

    if (options.memory && (options.persistMemory ?? true)) {
      yield* options.memory.write(
        `run:${options.plan.pipeline.name}:${options.request.idempotencyKey ?? options.plan.request.contentTypeId}`,
        {
          content,
          adapter: options.selection.adapter,
          model: options.selection.model,
          qualityMode: options.selection.qualityMode,
          completedAt: new Date().toISOString()
        }
      );
    }

    return {
      content,
      trace,
      adapter: options.selection.adapter,
      model: options.selection.model,
      attemptsUsed,
      metrics,
      providerAttempts
    };
  }).pipe(
    Effect.provide(contextLayer),
    Effect.provide(traceLayer),
    Effect.catchAll((error) =>
      Effect.fail(
        normalizeExecutionFailure(error, {
          message: `Pipeline "${options.plan.pipeline.name}" failed unexpectedly during execution`,
          reason: "unexpected_execution_failure"
        })
      )
    )
  );
}

function resolveStepFailureReason(
  trace: {
    readonly steps?: ReadonlyArray<{
      readonly step?: { readonly name?: string };
      readonly error?: { readonly message?: string; readonly cause?: unknown };
    }>;
    readonly events?: ReadonlyArray<{
      readonly type?: string;
      readonly stepName?: string;
      readonly payload?: Record<string, unknown>;
    }>;
  },
  stepName: string
): string {
  const failedProviderAttempt = [...(trace.events ?? [])]
    .reverse()
    .find((event) =>
      event.type === "provider-attempt" &&
      event.stepName === stepName &&
      typeof event.payload?.error === "string" &&
      event.payload.error.trim().length > 0
    );

  if (typeof failedProviderAttempt?.payload?.error === "string" && failedProviderAttempt.payload.error.trim().length > 0) {
    return failedProviderAttempt.payload.error;
  }

  const tracedStep = [...(trace.steps ?? [])]
    .reverse()
    .find((step) => step.step?.name === stepName && step.error);

  const causeMessage = toCauseMessage(tracedStep?.error?.cause);
  if (causeMessage) {
    return causeMessage;
  }

  if (tracedStep?.error?.message) {
    return tracedStep.error.message;
  }

  return "unknown step error";
}

function toCauseMessage(cause: unknown): string | undefined {
  if (cause instanceof Error && cause.message.trim().length > 0) {
    return cause.message;
  }

  if (typeof cause === "string" && cause.trim().length > 0) {
    return cause;
  }

  if (cause && typeof cause === "object" && "message" in cause && typeof (cause as { message?: unknown }).message === "string") {
    const message = (cause as { message: string }).message.trim();
    return message.length > 0 ? message : undefined;
  }

  return undefined;
}
