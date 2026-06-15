import { Context } from "effect";
import type { CandidateSelectionContext, CandidateText } from "../types.js";
import type { CandidateSelectionError } from "../errors.js";

export interface CandidateSelectorContract {
  readonly select: (
    candidates: readonly CandidateText[],
    context: CandidateSelectionContext
  ) => import("effect").Effect.Effect<CandidateText, CandidateSelectionError>;
}

export class CandidateSelector extends Context.Tag("CandidateSelector")<
  CandidateSelector,
  CandidateSelectorContract
>() {}
