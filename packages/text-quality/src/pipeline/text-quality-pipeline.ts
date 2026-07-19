import { Effect } from "effect";
import { VoiceProfileResolver } from "../services/VoiceProfileResolver.js";
import { CandidateScorer } from "../services/CandidateScorer.js";
import { CandidateSelector } from "../services/CandidateSelector.js";
import { buildTextQualityContext, resolveVoiceProfile } from "../voice/voice-resolution.js";
import { runQualityLane } from "../candidate/lane-runner.js";
import { resolveContentTypeQualityProfile } from "../quality/content-type-quality-profile.js";
import {
  DEFAULT_LANE_CONCURRENCY_CAP,
  type TextQualityRequest,
  type TextQualityResult,
  type TextQualityContext
} from "../types.js";
import type { TextQualityError } from "../errors.js";

export function runTextQualityPipeline(
  request: TextQualityRequest
): Effect.Effect<
  TextQualityResult,
  TextQualityError,
  VoiceProfileResolver | CandidateScorer | CandidateSelector
> {
  return Effect.gen(function* () {
    const voiceResolver = yield* VoiceProfileResolver;
    const scorer = yield* CandidateScorer;
    const selector = yield* CandidateSelector;

    const voiceProfile = yield* voiceResolver.resolve({
      request: request.request,
      userId: request.userId,
      briefing: request.briefing,
      voiceHints: request.voiceHints
    });

    const context: TextQualityContext = buildTextQualityContext(
      {
        request: request.request,
        userId: request.userId,
        briefing: request.briefing,
        voiceHints: request.voiceHints,
        generationContext: request.generationContext,
        lexicalQualityV2: request.lexicalQualityV2
      },
      voiceProfile,
      request.now
    );

    const qualityProfile = resolveContentTypeQualityProfile(request.request);

    const candidates = yield* Effect.forEach(
      request.lanes,
      (lane) =>
        Effect.gen(function* () {
          const candidate = yield* runQualityLane(lane, context, request.onLaneProgress);

          const scored = yield* scorer.score({
            criticScore: candidate.critic.score,
            fidelityScore: candidate.fidelity.score,
            driftScore: candidate.drift.score,
            strategy: lane.strategy,
            qualityProfile,
            lexicalPenalty: candidate.lexicalPenalty,
            reasoningEvaluationEnabled: request.reasoningEvaluationEnabled === true
          });

          return {
            ...candidate,
            score: scored
          };
        }),
      { concurrency: request.laneConcurrencyCap ?? DEFAULT_LANE_CONCURRENCY_CAP }
    );

    const bestCandidate = yield* selector.select(candidates, {
      request: request.request,
      briefing: request.briefing,
      voiceProfile,
      generationContext: request.generationContext,
      lexicalQualityV2: request.lexicalQualityV2
    });

    return {
      output: bestCandidate.refinedDraft,
      bestCandidate,
      candidates,
      voiceProfile
    };
  });
}
