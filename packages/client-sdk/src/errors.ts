import { Data } from "effect";
import type { ApiErrorCategory, ApiErrorCode, ObservationFailureReason } from "@my-ai-orchestrator/contracts";

export class ClientSdkInvalidRequestError extends Data.TaggedError("ClientSdkInvalidRequestError")<{
  readonly message: string;
  readonly request: unknown;
}> {}

export class ClientSdkHttpStatusError extends Data.TaggedError("ClientSdkHttpStatusError")<{
  readonly label: string;
  readonly status: number;
  readonly code?: ApiErrorCode;
  readonly category?: ApiErrorCategory;
  readonly retryable: boolean;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly responseMessage?: string;
}> {}

export class ClientSdkResponseDecodeError extends Data.TaggedError("ClientSdkResponseDecodeError")<{
  readonly label: string;
  readonly message: string;
  readonly body: unknown;
}> {}

export class ClientSdkTransportError extends Data.TaggedError("ClientSdkTransportError")<{
  readonly stage: "token" | "fetch" | "body" | "aborted";
  readonly message: string;
}> {}

export class ClientSdkContractFailure extends Data.TaggedError("ClientSdkContractFailure")<{
  readonly label: string;
  readonly message: string;
  readonly body: unknown;
}> {}

export class ClientSdkObservationFailure extends Data.TaggedError("ClientSdkObservationFailure")<{
  readonly reason: ObservationFailureReason;
  readonly message: string;
}> {}

export type ClientSdkError =
  | ClientSdkInvalidRequestError
  | ClientSdkHttpStatusError
  | ClientSdkResponseDecodeError
  | ClientSdkTransportError
  | ClientSdkContractFailure
  | ClientSdkObservationFailure;

const CLIENT_SDK_ERROR_TAGS = new Set([
  "ClientSdkInvalidRequestError",
  "ClientSdkHttpStatusError",
  "ClientSdkResponseDecodeError",
  "ClientSdkTransportError",
  "ClientSdkContractFailure",
  "ClientSdkObservationFailure"
]);

export function isClientSdkError(error: unknown, tag?: string): boolean {
  if (typeof error !== "object" || error === null || !("_tag" in error)) {
    return false;
  }

  const errorTag = (error as { _tag: string })._tag;
  if (tag !== undefined) {
    return errorTag === tag;
  }

  return CLIENT_SDK_ERROR_TAGS.has(errorTag);
}
