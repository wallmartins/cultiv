import { Effect } from "effect";
import { CandidateSelectionError } from "../errors.js";
import { authorizeLexicalOutput } from "../gates/lexical-release-gate.js";
import { countWords, resolveOutputWordTarget } from "../format/output-length.js";
import { resolveContentTypeQualityProfile } from "../quality/content-type-quality-profile.js";
import { measureLexicalQuality } from "../quality/lexical-quality.js";
import type { CandidateSelectionContext, CandidateText } from "../types.js";

export function selectBestCandidate(
  candidates: readonly CandidateText[],
  context: CandidateSelectionContext
): Effect.Effect<CandidateText, CandidateSelectionError> {
  if (candidates.length === 0) {
    return Effect.fail(new CandidateSelectionError({ message: "No candidates available", candidatesCount: 0 }));
  }

  const qualityProfile = resolveContentTypeQualityProfile(context.request);
  const eligible = context.lexicalQualityV2
    ? candidates.filter((candidate) =>
      authorizeLexicalOutput({
        text: candidate.refinedDraft,
        profile: qualityProfile,
        lexicalQualityV2: true
      }).decision === "pass"
    )
    : candidates;

  const pool = eligible.length > 0 ? eligible : candidates;

  const ranked = [...pool].sort((left, right) => {
    const rightScore = scoreCandidateForSelection(right, context, qualityProfile);
    const leftScore = scoreCandidateForSelection(left, context, qualityProfile);
    if (rightScore !== leftScore) return rightScore - leftScore;
    if (right.score.finalScore !== left.score.finalScore) return right.score.finalScore - left.score.finalScore;
    const rightDiversity = lexicalDiversity(right.refinedDraft);
    const leftDiversity = lexicalDiversity(left.refinedDraft);
    if (rightDiversity !== leftDiversity) return rightDiversity - leftDiversity;
    if (right.score.fidelityScore !== left.score.fidelityScore) return right.score.fidelityScore - left.score.fidelityScore;
    return right.score.criticScore - left.score.criticScore;
  });

  return Effect.succeed(ranked[0] as CandidateText);
}

// Selection-only ranking: starts from the candidate's finalScore (the quality blend, plus
// the judge blend when it runs) and subtracts disqualifier penalties for the sort. Ephemeral,
// never persisted — distinct from scorer.ts's scoreCandidate, which produces the finalScore.
function scoreCandidateForSelection(
  candidate: CandidateText,
  context: CandidateSelectionContext,
  qualityProfile: ReturnType<typeof resolveContentTypeQualityProfile>
): number {
  let score = candidate.score.finalScore;

  if (hasMetaCommentary(candidate.refinedDraft)) {
    score -= 60;
  }

  if (looksLikeFormatMismatch(candidate.refinedDraft, context.request)) {
    score -= 20;
  }

  score += scoreLengthAlignment(candidate.refinedDraft, context);

  if (context.lexicalQualityV2) {
    const gate = authorizeLexicalOutput({
      text: candidate.refinedDraft,
      profile: qualityProfile,
      lexicalQualityV2: true
    });
    if (gate.decision === "reject") {
      score -= 80;
    } else if (gate.reasons.length > 0) {
      score -= Math.min(20, gate.reasons.length * 5);
    }
  }

  return score;
}

function lexicalDiversity(text: string): number {
  return Math.round(measureLexicalQuality(text).typeTokenRatio * 100);
}

function hasMetaCommentary(text: string): boolean {
  return [
    /\b(aqui est[aá]|segue|abaixo est[aá])\b/iu,
    /\b(vers[aã]o refinada|vers[aã]o revisada|texto refinado|texto revisado)\b/iu,
    /\b(mantendo o rigor|mantendo a naturalidade|eliminando o ru[ií]do)\b/iu,
    /\b(reescrevi|refinei|ajustei|editei)\b/iu,
    /^\*{2,}/u
  ].some((pattern) => pattern.test(text));
}

function looksLikeFormatMismatch(text: string, request: CandidateSelectionContext["request"]): boolean {
  const pipelineName = resolveRequestFormatName(request).toLowerCase();
  const normalized = text.trim();

  if (pipelineName.includes("thread") || pipelineName.includes("twitter")) {
    return normalized.includes("***") || normalized.includes("1.") || normalized.length > 2200;
  }

  if (pipelineName.includes("linkedin") || pipelineName.includes("post")) {
    return /^\s*[-*]\s+/m.test(normalized);
  }

  return false;
}

function resolveRequestFormatName(request: CandidateSelectionContext["request"]): string {
  if ("pipeline" in request && request.pipeline && typeof request.pipeline.name === "string") {
    return request.pipeline.name;
  }

  if ("pipelineType" in request && typeof request.pipelineType === "string") {
    return request.pipelineType;
  }

  if ("contentType" in request && typeof request.contentType === "string") {
    return request.contentType;
  }

  return "";
}

function scoreLengthAlignment(text: string, context: CandidateSelectionContext): number {
  const target = resolveOutputWordTarget(context.request);
  const wordCount = countWords(text);

  if (wordCount >= target.minWords && wordCount <= target.maxWords) {
    const distance = Math.abs(wordCount - target.idealWords);
    const span = Math.max(1, target.maxWords - target.minWords);
    return Math.max(4, 18 - Math.round((distance / span) * 18));
  }

  if (wordCount < target.minWords) {
    const deficitRatio = (target.minWords - wordCount) / target.minWords;
    return -Math.min(45, Math.round(deficitRatio * 55));
  }

  const overflowRatio = (wordCount - target.maxWords) / target.maxWords;
  return -Math.min(30, Math.round(overflowRatio * 35));
}
