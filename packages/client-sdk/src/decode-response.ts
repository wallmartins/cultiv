import { Effect } from "effect";
import type { ContractDecodeError } from "@my-ai-orchestrator/contracts";
import { decodeApiErrorResponse } from "@my-ai-orchestrator/contracts";
import type { ApiErrorResponse } from "@my-ai-orchestrator/contracts";
import {
  ClientSdkContractFailure,
  ClientSdkHttpStatusError,
  ClientSdkResponseDecodeError,
  ClientSdkTransportError
} from "./errors.js";

export interface HttpResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: unknown;
}

export function parseJsonBodyEffect(body: unknown): Effect.Effect<unknown, ClientSdkResponseDecodeError> {
  if (typeof body !== "string") {
    return Effect.succeed(body);
  }

  return Effect.try({
    try: () => JSON.parse(body),
    catch: (error) =>
      new ClientSdkResponseDecodeError({
        label: "json body",
        message: toErrorMessage(error),
        body
      })
  });
}

export function assertOkResponseEffect(
  response: HttpResponse,
  label: string
): Effect.Effect<void, ClientSdkHttpStatusError> {
  if (response.status >= 200 && response.status < 300) {
    return Effect.succeed(undefined);
  }

  return Effect.gen(function* () {
    const apiError = yield* decodeApiErrorResponseEffect(response.body);
    return yield* Effect.fail(
      new ClientSdkHttpStatusError({
        label,
        status: response.status,
        code: apiError?.code,
        category: apiError?.category,
        retryable: apiError?.retryable ?? (response.status >= 500 || response.status === 429),
        details: apiError?.details,
        responseMessage: apiError?.message
      })
    );
  });
}

export function decodeResponseBodyEffect<T>(
  response: HttpResponse,
  label: string,
  decoder: (input: unknown) => Effect.Effect<T, ContractDecodeError>
): Effect.Effect<T, ClientSdkResponseDecodeError | ClientSdkContractFailure> {
  return Effect.gen(function* () {
    const parsed = yield* parseJsonBodyEffect(response.body);
    return yield* decoder(parsed).pipe(
      Effect.mapError((error) =>
        new ClientSdkContractFailure({
          label,
          message: error.message,
          body: response.body
        })
      )
    );
  });
}

export function decodeOkResponseEffect<T>(
  response: HttpResponse,
  label: string,
  decoder: (input: unknown) => Effect.Effect<T, ContractDecodeError>
): Effect.Effect<T, ClientSdkHttpStatusError | ClientSdkResponseDecodeError | ClientSdkContractFailure> {
  return Effect.gen(function* () {
    yield* assertOkResponseEffect(response, label);
    return yield* decodeResponseBodyEffect(response, label, decoder);
  });
}

export function readResponseBodyEffect(
  response: Response,
  signal?: AbortSignal
): Effect.Effect<unknown, ClientSdkTransportError> {
  if (signal?.aborted) {
    return Effect.fail(
      new ClientSdkTransportError({
        stage: "aborted",
        message: "Request was aborted"
      })
    );
  }

  const contentType = response.headers.get("content-type") ?? "";

  return Effect.tryPromise({
    try: async () => {
      if (contentType.includes("application/json")) {
        return await response.json();
      }

      return await response.text();
    },
    catch: (error) =>
      new ClientSdkTransportError({
        stage: "body",
        message: toErrorMessage(error)
      })
  });
}

function decodeApiErrorResponseEffect(body: unknown): Effect.Effect<ApiErrorResponse | undefined, never> {
  return parseJsonBodyEffect(body).pipe(
    Effect.flatMap((parsed) =>
      decodeApiErrorResponse(parsed).pipe(
        Effect.map((response) => response as ApiErrorResponse),
        Effect.catchAll(() => Effect.succeed<ApiErrorResponse | undefined>(undefined))
      )
    ),
    Effect.catchAll(() => Effect.succeed<ApiErrorResponse | undefined>(undefined))
  );
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
