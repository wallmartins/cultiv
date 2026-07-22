import { Data } from "effect";

export class PracticeProfileGenerationError extends Data.TaggedError(
  "PracticeProfileGenerationError"
)<{
  readonly message: string;
}> {}

// F5-2 · /voice declaration edit: the input failed the same non-empty guard the calibration wizard
// applies (toDeclaredAxes) — subject/vantagePoint blank or no audiences left after trimming.
export class PracticeProfileValidationError extends Data.TaggedError(
  "PracticeProfileValidationError"
)<{
  readonly message: string;
}> {}

// F5-2 · a material declared-axes edit re-seeds the profile (C-1); this wraps a failed/timed-out
// re-seed (policy resolution, provider chain exhaustion, or the 60s aggregate ceiling).
export class PracticeProfileDerivationError extends Data.TaggedError(
  "PracticeProfileDerivationError"
)<{
  readonly userId: string;
  readonly message: string;
}> {}
