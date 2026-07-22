import { Data } from "effect";

export class PracticeProfileGenerationError extends Data.TaggedError(
  "PracticeProfileGenerationError"
)<{
  readonly message: string;
}> {}
