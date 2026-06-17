import { Effect } from "effect";
import { CandidateGenerationError } from "../errors.js";
import { criticizeText } from "../quality/critic.js";
import { evaluateFidelity } from "../quality/fidelity.js";
import { evaluateVoiceDrift } from "../quality/drift.js";
import { humanizeText, refineText } from "../quality/humanizer.js";
import { evaluateLexicalQuality } from "../quality/lexical-quality.js";
import type { CandidateText, CandidateScoreBreakdown, LaneProgress, QualityLane, TextQualityContext } from "../types.js";

export function runQualityLane(
  lane: QualityLane,
  context: TextQualityContext,
  onProgress?: (progress: LaneProgress) => Effect.Effect<void>
): Effect.Effect<CandidateText, CandidateGenerationError> {
  return Effect.gen(function* () {
    yield* emitLaneProgress(onProgress, lane.laneId, "draft", 10, `Generating candidate for ${lane.strategy} lane`);
    const draft = yield* Effect.catchAll(
      lane.generate(context),
      (error) =>
        Effect.fail(
          new CandidateGenerationError({
            laneId: lane.laneId,
            message: error instanceof Error ? error.message : "Lane generation failed"
          })
        )
    );

    const hookText = resolveHookText(context);

    yield* emitLaneProgress(onProgress, lane.laneId, "critic", 30, `Running critic for ${lane.laneId}`);
    const critic = criticizeText(draft, context.voiceProfile, context.request, {
      domain: context.generationContext?.domain,
      hookText,
      lexicalQualityV2: context.lexicalQualityV2,
      stepName: "draft"
    });

    yield* emitLaneProgress(onProgress, lane.laneId, "fidelity", 45, `Checking fidelity for ${lane.laneId}`);
    const fidelity = evaluateFidelity(context.briefing, draft, {
      lexicalQualityV2: context.lexicalQualityV2
    });

    yield* emitLaneProgress(onProgress, lane.laneId, "drift", 60, `Checking voice drift for ${lane.laneId}`);
    const drift = evaluateVoiceDrift(context.voiceProfile, draft, context.request, "draft");

    yield* emitLaneProgress(onProgress, lane.laneId, "humanize", 75, `Humanizing candidate for ${lane.laneId}`);
    const humanizedDraft = humanizeText(draft, context.voiceProfile);

    yield* emitLaneProgress(onProgress, lane.laneId, "refine", 90, `Applying minimal refinement for ${lane.laneId}`);
    const refinedDraft = refineText(humanizedDraft, context.voiceProfile);

    yield* emitLaneProgress(onProgress, lane.laneId, "score", 100, `Scoring candidate for ${lane.laneId}`);

    return {
      laneId: lane.laneId,
      draft,
      humanizedDraft,
      refinedDraft,
      critic,
      fidelity,
      drift,
      score: emptyScore(),
      lexicalPenalty: context.lexicalQualityV2
        ? evaluateLexicalQuality(refinedDraft, context.generationContext?.domain, hookText).penalty
        : 0
    };
  });
}

function resolveHookText(context: TextQualityContext): string | undefined {
  const formatName = resolveFormatName(context.request).toLowerCase();
  if (!formatName.includes("linkedin") && !formatName.includes("thread") && !formatName.includes("twitter")) {
    return undefined;
  }

  const hook = readRequestInput(context.request, "hook");
  return typeof hook === "string" && hook.trim().length > 0 ? hook : undefined;
}

function resolveFormatName(request: TextQualityContext["request"]): string {
  if ("pipeline" in request && request.pipeline && typeof request.pipeline.name === "string") {
    return request.pipeline.name;
  }

  if ("contentType" in request && typeof request.contentType === "string") {
    return request.contentType;
  }

  if ("pipelineType" in request && typeof request.pipelineType === "string") {
    return request.pipelineType;
  }

  return "";
}

function readRequestInput(request: TextQualityContext["request"], key: string): unknown {
  if ("inputs" in request && request.inputs && typeof request.inputs === "object") {
    return (request.inputs as Record<string, unknown>)[key];
  }

  return undefined;
}

function emptyScore(): CandidateScoreBreakdown {
  return {
    criticScore: 0,
    fidelityScore: 0,
    driftScore: 0,
    strategyBonus: 0,
    finalScore: 0
  };
}

function emitLaneProgress(
  onProgress: ((progress: LaneProgress) => Effect.Effect<void>) | undefined,
  laneId: string,
  stage: LaneProgress["stage"],
  percent: number,
  message: string
): Effect.Effect<void, never> {
  if (!onProgress) {
    return Effect.void;
  }

  return onProgress({
    laneId,
    stage,
    percent,
    message
  });
}
