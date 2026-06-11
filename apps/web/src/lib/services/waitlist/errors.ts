import { Data } from "effect";

export class WaitlistValidationError extends Data.TaggedError("WaitlistValidationError")<{
  readonly field: string;
  readonly message: string;
}> {}

export class WaitlistProviderError extends Data.TaggedError("WaitlistProviderError")<{
  readonly message: string;
}> {}

export class WaitlistRateLimitedError extends Data.TaggedError("WaitlistRateLimitedError")<{
  readonly message: string;
}> {}
