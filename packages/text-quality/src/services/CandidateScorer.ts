import { Context } from "effect";
import type { CandidateScoreBreakdown } from "../types.js";
import type { CandidateScoreInput } from "../quality/scorer.js";

export interface CandidateScorerContract {
  readonly score: (input: CandidateScoreInput) => import("effect").Effect.Effect<CandidateScoreBreakdown, never>;
}

export class CandidateScorer extends Context.Tag("CandidateScorer")<
  CandidateScorer,
  CandidateScorerContract
>() {}
