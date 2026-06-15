import { Context } from "effect";
import type { TextQualityRequest, TextQualityResult } from "../types.js";
import type { TextQualityError } from "../errors.js";
import type { CandidateScorer } from "./CandidateScorer.js";
import type { CandidateSelector } from "./CandidateSelector.js";
import type { VoiceProfileResolver } from "./VoiceProfileResolver.js";

export interface TextQualityServiceContract {
  readonly run: (
    input: TextQualityRequest
  ) => import("effect").Effect.Effect<
    TextQualityResult,
    TextQualityError,
    VoiceProfileResolver | CandidateScorer | CandidateSelector
  >;
}

export class TextQualityService extends Context.Tag("TextQualityService")<
  TextQualityService,
  TextQualityServiceContract
>() {}
