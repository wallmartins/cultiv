import { Effect } from "effect";
import {
  CandidateGenerationError,
  CandidateSelectionError,
  createTextQualityLiveLayer,
  TextQualityInputError,
  TextQualityService,
  VoiceProfileNotFoundError
} from "@my-ai-orchestrator/text-quality";
import { resolveBackendBillingIdentity } from "../billing.js";
import { createExecutionFailure, normalizeExecutionFailure } from "../pipeline/execution-failure.js";
import {
  type BackendAdapterMetrics,
  type ExecutePipelineAttemptArgs,
  type ExecutePipelineAttemptResult
} from "../pipeline/pipeline-attempt.js";
import { filterLexiconForDomain } from "../../product/voice/voice-hints.js";
import { resolveGenerationRuntimeContext } from "../pipeline/generation-runtime.js";
import { resolveBriefingText } from "./quality-briefing.js";
import { buildRuntimeQualityLanes, laneCountForQualityMode } from "./quality-lanes.js";
import {
  createRuntimeMetadataRequest,
  resolveSanitizedGenerationInput,
  toRuntimeInputRecord
} from "../pipeline/sanitized-generation-input.js";

export interface BackendQualitySelectionResult extends ExecutePipelineAttemptResult {
  readonly score: number;
}

export function executeQualitySelectionAttempt(
  options: ExecutePipelineAttemptArgs & { readonly billingIdentity: ReturnType<typeof resolveBackendBillingIdentity> }
): Effect.Effect<BackendQualitySelectionResult, import("../../http/errors.js").BackendExecutionFailedError> {
  const candidateRuns = new Map<string, ExecutePipelineAttemptResult>();
  const laneCount = laneCountForQualityMode(options.qualityMode);
  const runtimeLanes = buildRuntimeQualityLanes(options, laneCount, candidateRuns);
  const sanitizedInput = resolveSanitizedGenerationInput(options.request, options.plan);
  const runtimeInputs = toRuntimeInputRecord(sanitizedInput);
  const briefing = resolveBriefingText(runtimeInputs);
  const generationContext = resolveGenerationRuntimeContext({
    contentType: options.plan.contentType.id,
    inputs: runtimeInputs
  });
  const lexicalQualityV2 = options.services.featureFlags.isEnabled("generation.lexicalQualityV2", {
    contentType: options.plan.contentType.id,
    pipelineType: options.plan.contentType.id,
    qualityMode: options.qualityMode,
    userId: options.billingIdentity.userId,
    environment: options.config.environment
  });
  const voiceHints = options.voice?.voiceHints
    ? {
        ...options.voice.voiceHints,
        lexicon: filterLexiconForDomain(options.voice.voiceHints.lexicon ?? [], generationContext.domain)
      }
    : undefined;

  return Effect.gen(function* () {
    const qualityService = yield* TextQualityService;
    const qualityResult = yield* qualityService.run({
      request: createRuntimeMetadataRequest(options.request),
      userId: options.billingIdentity.userId,
      briefing,
      voiceHints,
      generationContext,
      lexicalQualityV2,
      lanes: runtimeLanes,
      now: options.now
    }).pipe(
      Effect.catchTag("CandidateGenerationError", (error: CandidateGenerationError) =>
        Effect.fail(
          createExecutionFailure({
            message: `Quality lane "${error.laneId}" failed while generating execution candidates for pipeline "${options.plan.pipeline.name}": ${error.message}`,
            reason: "pipeline_step_failed"
          })
        )
      ),
      Effect.catchTag("CandidateSelectionError", (error: CandidateSelectionError) =>
        Effect.fail(
          createExecutionFailure({
            message: `Quality candidate selection failed for pipeline "${options.plan.pipeline.name}": ${error.message}`,
            reason: "quality_candidate_missing"
          })
        )
      ),
      Effect.catchTag("TextQualityInputError", (error: TextQualityInputError) =>
        Effect.fail(
          createExecutionFailure({
            message: `Text quality input is invalid for pipeline "${options.plan.pipeline.name}": ${error.message}`,
            reason: "unexpected_execution_failure"
          })
        )
      ),
      Effect.catchTag("VoiceProfileNotFoundError", (error: VoiceProfileNotFoundError) =>
        Effect.fail(
          createExecutionFailure({
            message: `Text quality could not resolve a voice profile for user "${error.userId}" in pipeline "${options.plan.pipeline.name}"`,
            reason: "voice_profile_unavailable"
          })
        )
      ),
      Effect.catchAll((error) =>
        Effect.fail(
          normalizeExecutionFailure(error, {
            message: `Text quality evaluation failed for pipeline "${options.plan.pipeline.name}"`,
            reason: "unexpected_execution_failure"
          })
        )
      )
    );

    const selectedRun = candidateRuns.get(qualityResult.bestCandidate.laneId);
    if (!selectedRun) {
      return yield* Effect.fail(
        createExecutionFailure({
          message: `Quality candidate "${qualityResult.bestCandidate.laneId}" was selected but no execution result was captured`,
          reason: "quality_candidate_missing"
        })
      );
    }

    if (options.memory) {
      yield* options.memory.write(
        `run:${options.plan.pipeline.name}:${options.request.idempotencyKey ?? options.plan.request.contentTypeId}`,
        {
          content: qualityResult.output,
          adapter: selectedRun.adapter,
          model: selectedRun.model,
          qualityMode: options.qualityMode,
          completedAt: options.now().toISOString()
        }
      );
    }

    const aggregateMetrics = aggregateCandidateMetrics(candidateRuns.values());

    return {
      content: qualityResult.output,
      trace: selectedRun.trace,
      adapter: selectedRun.adapter,
      model: selectedRun.model,
      attemptsUsed: aggregateMetrics.attemptsUsed,
      metrics: aggregateMetrics.metrics,
      providerAttempts: aggregateMetrics.providerAttempts,
      score: qualityResult.bestCandidate.score.finalScore
    };
  }).pipe(Effect.provide(createTextQualityLiveLayer()));
}

function aggregateCandidateMetrics(
  candidates: Iterable<ExecutePipelineAttemptResult>
): {
  readonly attemptsUsed: number;
  readonly metrics: BackendAdapterMetrics;
  readonly providerAttempts: ExecutePipelineAttemptResult["providerAttempts"];
} {
  let attemptsUsed = 0;
  let inputTokensTotal = 0;
  let outputTokensTotal = 0;
  let debitedCredits = 0;
  let estimatedUsdCost = 0;
  const providerAttempts: ExecutePipelineAttemptResult["providerAttempts"][number][] = [];

  for (const candidate of candidates) {
    attemptsUsed += candidate.attemptsUsed;
    inputTokensTotal += candidate.metrics.inputTokensTotal;
    outputTokensTotal += candidate.metrics.outputTokensTotal;
    debitedCredits += candidate.metrics.debitedCredits;
    estimatedUsdCost += candidate.metrics.estimatedUsdCost;
    providerAttempts.push(...candidate.providerAttempts);
  }

  return {
    attemptsUsed,
    metrics: {
      inputTokensTotal,
      outputTokensTotal,
      debitedCredits,
      estimatedUsdCost
    },
    providerAttempts
  };
}

export { laneCountForQualityMode } from "./quality-lanes.js";
