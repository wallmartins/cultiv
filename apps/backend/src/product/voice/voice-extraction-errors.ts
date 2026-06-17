import { Data } from "effect";

export class ReasoningExtractionError extends Data.TaggedError("ReasoningExtractionError")<{
  readonly message: string;
}> {}

export class ArgumentDevelopmentExtractionError extends Data.TaggedError(
  "ArgumentDevelopmentExtractionError"
)<{
  readonly message: string;
}> {}

export class VoiceSignatureReconciliationError extends Data.TaggedError(
  "VoiceSignatureReconciliationError"
)<{
  readonly message: string;
}> {}
