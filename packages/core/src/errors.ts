import { Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly skillName: string;
  readonly missingInputs: readonly string[];
  readonly message: string;
}> {}

export class StepExecutionError extends Data.TaggedError("StepExecutionError")<{
  readonly stepName: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class TemplateError extends Data.TaggedError("TemplateError")<{
  readonly template: string;
  readonly message: string;
}> {}
