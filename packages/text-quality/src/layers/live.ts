import { Layer, Effect } from "effect";
import { VoiceProfileResolver } from "../services/VoiceProfileResolver.js";
import { CandidateScorer } from "../services/CandidateScorer.js";
import { CandidateSelector } from "../services/CandidateSelector.js";
import { TextQualityService } from "../services/TextQualityService.js";
import { resolveVoiceProfile } from "../voice/voice-resolution.js";
import { selectBestCandidate } from "../candidate/candidate-selector.js";
import { scoreCandidate } from "../quality/scorer.js";
import { runTextQualityPipeline } from "../pipeline/text-quality-pipeline.js";

export function createVoiceProfileResolverLayer() {
  return Layer.succeed(VoiceProfileResolver, {
    resolve: resolveVoiceProfile
  });
}

export function createCandidateScorerLayer() {
  return Layer.succeed(CandidateScorer, {
    score: (input) => Effect.succeed(scoreCandidate(input))
  });
}

export function createCandidateSelectorLayer() {
  return Layer.succeed(CandidateSelector, {
    select: selectBestCandidate
  });
}

export function createTextQualityServiceLayer() {
  return Layer.succeed(TextQualityService, {
    run: runTextQualityPipeline
  });
}

export function createTextQualityLiveLayer() {
  return Layer.mergeAll(
    createVoiceProfileResolverLayer(),
    createCandidateScorerLayer(),
    createCandidateSelectorLayer(),
    createTextQualityServiceLayer()
  );
}
