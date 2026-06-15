import { Data } from "effect";

export class AIAdapterProviderNotFoundError extends Data.TaggedError("AIAdapterProviderNotFoundError")<{
  readonly provider: string;
}> {}

export class AIAdapterInvalidRequestError extends Data.TaggedError("AIAdapterInvalidRequestError")<{
  readonly message: string;
  readonly request: unknown;
}> {}

export class AIAdapterInvalidResponseError extends Data.TaggedError("AIAdapterInvalidResponseError")<{
  readonly provider: string;
  readonly message: string;
  readonly response: unknown;
}> {}

export class AIAdapterTransportError extends Data.TaggedError("AIAdapterTransportError")<{
  readonly provider: string;
  readonly message: string;
}> {}
