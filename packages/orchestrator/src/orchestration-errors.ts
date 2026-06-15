import { Data } from "effect";

export class OrchestrationSkillNotFoundError extends Data.TaggedError("OrchestrationSkillNotFoundError")<{
  readonly skillName: string;
  readonly availableSkills: readonly string[];
}> {}

export class OrchestrationStepFailedError extends Data.TaggedError("OrchestrationStepFailedError")<{
  readonly stepName: string;
  readonly skillName: string;
  readonly attempt: number;
  readonly message: string;
  readonly canContinue: boolean;
}> {}

export class OrchestrationPipelineExhaustedError extends Data.TaggedError("OrchestrationPipelineExhaustedError")<{
  readonly pipelineName: string;
  readonly totalSteps: number;
  readonly completedSteps: number;
  readonly reason: string;
}> {}

export class OrchestrationContextError extends Data.TaggedError("OrchestrationContextError")<{
  readonly operation: string;
  readonly message: string;
}> {}

export class OrchestrationRetryExhaustedError extends Data.TaggedError("OrchestrationRetryExhaustedError")<{
  readonly stepName: string;
  readonly skillName: string;
  readonly maxAttempts: number;
  readonly lastError: string;
}> {}

export class OrchestrationCancelledError extends Data.TaggedError("OrchestrationCancelledError")<{
  readonly reason: string;
}> {}

export class OrchestrationAdapterError extends Data.TaggedError("OrchestrationAdapterError")<{
  readonly adapterName: string;
  readonly stepName: string;
  readonly message: string;
}> {}

export type OrchestrationError =
  | OrchestrationSkillNotFoundError
  | OrchestrationStepFailedError
  | OrchestrationPipelineExhaustedError
  | OrchestrationContextError
  | OrchestrationRetryExhaustedError
  | OrchestrationCancelledError
  | OrchestrationAdapterError;