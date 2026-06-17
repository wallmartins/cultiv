import { Effect } from "effect";
import type { QualityMode } from "@my-ai-orchestrator/contracts";
import { selectBestCandidate, type CandidateText, type VoiceProfile } from "@my-ai-orchestrator/text-quality";
import type { GenerationContext } from "@my-ai-orchestrator/text-quality";
import type { BackendObservabilityService } from "../../product/core/observability-types.js";
import type { BackendAIPolicyServiceContract, AIPolicyProviderModelAttempt } from "../../product/ai-policy/ai-policy-types.js";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import { createExecutionFailure } from "../pipeline/execution-failure.js";
import type { BackendProviderTransport } from "../pipeline/provider-transport.js";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import { createRuntimeMetadataRequest } from "../pipeline/sanitized-generation-input.js";
import { runVoiceJudgePass } from "./voice-judge.js";
import { logVoiceJudgeEvent } from "./voice-judge-logging.js";

export function applyVoiceJudgeToQualityResult(args: {
  readonly pipelineName: string;
  readonly request: PipelineRequest;
  readonly qualityMode: QualityMode;
  readonly reasoningSignatureEnabled: boolean;
  readonly briefing: string;
  readonly generationContext?: GenerationContext;
  readonly lexicalQualityV2: boolean;
  readonly candidates: readonly CandidateText[];
  readonly bestCandidate: CandidateText;
  readonly output: string;
  readonly voiceProfile: VoiceProfile;
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
  readonly observability?: BackendObservabilityService;
}): Effect.Effect<{
  readonly bestCandidate: CandidateText;
  readonly output: string;
}, import("../../http/errors.js").BackendExecutionFailedError> {
  return Effect.gen(function* () {
    if (!args.reasoningSignatureEnabled || args.attempts.length === 0) {
      if (!args.reasoningSignatureEnabled) {
        logVoiceJudgeEvent("skipped", {
          pipelineName: args.pipelineName,
          qualityMode: args.qualityMode,
          reason: "reasoning_signature_flag_disabled"
        });
      }

      if (args.reasoningSignatureEnabled && args.attempts.length === 0) {
        logVoiceJudgeEvent("skipped", {
          pipelineName: args.pipelineName,
          qualityMode: args.qualityMode,
          reason: "no_routing_attempts"
        });
        yield* args.observability?.recordVoiceJudgeFallback({
          pipelineName: args.pipelineName,
          reason: "no_routing_attempts"
        }) ?? Effect.void;
      }

      return {
        bestCandidate: args.bestCandidate,
        output: args.output
      };
    }

    const judgedCandidates = yield* runVoiceJudgePass({
      candidates: args.candidates,
      voiceProfile: args.voiceProfile,
      qualityMode: args.qualityMode,
      reasoningSignatureEnabled: args.reasoningSignatureEnabled,
      attempts: args.attempts,
      aiAdapters: args.aiAdapters,
      providerTransport: args.providerTransport,
      observability: args.observability,
      pipelineName: args.pipelineName
    });

    const bestCandidate = yield* selectBestCandidate(judgedCandidates, {
      request: createRuntimeMetadataRequest(args.request),
      briefing: args.briefing,
      voiceProfile: args.voiceProfile,
      generationContext: args.generationContext,
      lexicalQualityV2: args.lexicalQualityV2
    }).pipe(
      Effect.catchAll((error) =>
        Effect.fail(
          createExecutionFailure({
            message: `Voice judge re-selection failed for pipeline "${args.pipelineName}": ${error.message}`,
            reason: "quality_candidate_missing"
          })
        )
      )
    );

    return {
      bestCandidate,
      output: bestCandidate.refinedDraft
    };
  });
}
