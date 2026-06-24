import { Data } from "effect";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class DatabaseJobAlreadyExistsError extends Data.TaggedError("DatabaseJobAlreadyExistsError")<{
  readonly jobId: string;
}> {}

export class DatabaseJobNotFoundError extends Data.TaggedError("DatabaseJobNotFoundError")<{
  readonly jobId: string;
}> {}

export class DatabaseTransactionInvariantError extends Data.TaggedError("DatabaseTransactionInvariantError")<{
  readonly message: string;
}> {}

export class DatabaseVoiceExampleAlreadyExistsError extends Data.TaggedError("DatabaseVoiceExampleAlreadyExistsError")<{
  readonly exampleId: string;
}> {}

export class DatabaseVoiceExampleNotFoundError extends Data.TaggedError("DatabaseVoiceExampleNotFoundError")<{
  readonly exampleId: string;
}> {}

export class DatabaseVoiceProfileNotFoundError extends Data.TaggedError("DatabaseVoiceProfileNotFoundError")<{
  readonly userId: string;
}> {}

export class DatabaseVoiceProfileDiagnosticsNotFoundError extends Data.TaggedError("DatabaseVoiceProfileDiagnosticsNotFoundError")<{
  readonly userId: string;
}> {}

export class DatabaseVoiceProfileSnapshotNotFoundError extends Data.TaggedError("DatabaseVoiceProfileSnapshotNotFoundError")<{
  readonly snapshotId: string;
}> {}

export class DatabaseVoiceBatchAlreadyExistsError extends Data.TaggedError("DatabaseVoiceBatchAlreadyExistsError")<{
  readonly batchId: string;
}> {}

export class DatabaseVoiceBatchNotFoundError extends Data.TaggedError("DatabaseVoiceBatchNotFoundError")<{
  readonly batchId: string;
}> {}

export class DatabaseVoiceTrainingConsentNotFoundError extends Data.TaggedError("DatabaseVoiceTrainingConsentNotFoundError")<{
  readonly userId: string;
}> {}
