import { Data } from "effect";

export class TextQualityInputError extends Data.TaggedError("TextQualityInputError")<{
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}> {}

export class VoiceProfileNotFoundError extends Data.TaggedError("VoiceProfileNotFoundError")<{
  readonly userId: string;
  readonly cause?: string;
}> {}

export class CandidateGenerationError extends Data.TaggedError("CandidateGenerationError")<{
  readonly laneId: string;
  readonly message: string;
}> {}

export class CandidateSelectionError extends Data.TaggedError("CandidateSelectionError")<{
  readonly message: string;
  readonly candidatesCount: number;
}> {}

export type TextQualityError =
  | TextQualityInputError
  | VoiceProfileNotFoundError
  | CandidateGenerationError
  | CandidateSelectionError;
