import { Data } from "effect";

export class FeatureFlagDefinitionError extends Data.TaggedError("FeatureFlagDefinitionError")<{
  readonly key?: string;
  readonly message: string;
}> {}

export class FeatureFlagRolloutError extends Data.TaggedError("FeatureFlagRolloutError")<{
  readonly key: string;
  readonly message: string;
}> {}

export class FeatureFlagVariantError extends Data.TaggedError("FeatureFlagVariantError")<{
  readonly key: string;
  readonly message: string;
}> {}
