import { Effect } from "effect";
import type { ClientSdkConfig, HttpMethod } from "./config.js";
import { resolveClientSdkConfig } from "./config.js";
import { readResponseBodyEffect } from "./decode-response.js";
import type { HttpResponse } from "./decode-response.js";
import { withIdempotencyKey } from "./idempotency.js";
import { ClientSdkTransportError } from "./errors.js";

export interface HttpRequest {
  readonly method: HttpMethod;
  readonly path: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly query?: Readonly<Record<string, string | number | boolean | null | undefined>>;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
  readonly idempotencyKey?: string;
}

export interface HttpTransport {
  readonly send: (request: HttpRequest) => Effect.Effect<HttpResponse, ClientSdkTransportError>;
  readonly openSse: (path: string, signal?: AbortSignal) => Effect.Effect<Response, ClientSdkTransportError>;
}

const GET_RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const MUTATE_RETRYABLE_STATUSES = new Set([429, 503, 504]);

export function createHttpTransport(config: ClientSdkConfig): HttpTransport {
  const resolved = resolveClientSdkConfig(config);
  const fetcher = config.fetcher ?? globalThis.fetch.bind(globalThis);

  return {
    send(request) {
      return sendWithRetry(resolved, fetcher, request);
    },
    openSse(path, signal) {
      return openSseEffect(resolved, fetcher, path, signal);
    }
  };
}

function sendWithRetry(
  config: ReturnType<typeof resolveClientSdkConfig>,
  fetcher: typeof fetch,
  request: HttpRequest
): Effect.Effect<HttpResponse, ClientSdkTransportError> {
  const retryKind = request.method === "GET" ? "get" : isMutatingMethod(request.method) ? "mutate" : "none";
  const policy = retryKind === "get" ? config.retryPolicy.get : retryKind === "mutate" ? config.retryPolicy.mutate : null;
  const maxAttempts = policy ? policy.maxRetries + 1 : 1;

  return Effect.gen(function* () {
    let lastError: ClientSdkTransportError | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (request.signal?.aborted) {
        return yield* Effect.fail(
          new ClientSdkTransportError({
            stage: "aborted",
            message: "Request was aborted"
          })
        );
      }

      const response = yield* Effect.either(executeFetch(config, fetcher, request));

      if (response._tag === "Right") {
        const httpResponse = response.right;
        if (policy && isRetryableStatus(httpResponse.status, retryKind) && attempt < maxAttempts - 1) {
          yield* sleepMs(policy.backoffBaseMs * 2 ** attempt, request.signal);
          continue;
        }

        return httpResponse;
      }

      lastError = response.left;
      if (attempt < maxAttempts - 1 && policy) {
        yield* sleepMs(policy.backoffBaseMs * 2 ** attempt, request.signal);
        continue;
      }

      return yield* Effect.fail(response.left);
    }

    return yield* Effect.fail(
      lastError ??
        new ClientSdkTransportError({
          stage: "fetch",
          message: "Request failed after retries"
        })
    );
  });
}

function executeFetch(
  config: ClientSdkConfig,
  fetcher: typeof fetch,
  request: HttpRequest
): Effect.Effect<HttpResponse, ClientSdkTransportError> {
  return Effect.gen(function* () {
    const url = new URL(request.path, config.baseUrl);
    if (request.query) {
      for (const [key, value] of Object.entries(request.query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const token = yield* resolveTokenEffect(config.getToken, { required: Boolean(config.getToken) });
    const headers: Record<string, string> = {
      accept: "application/json",
      ...config.headers,
      ...request.headers
    };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const bodyRecord =
      request.body !== undefined && typeof request.body === "object" && request.body !== null
        ? (request.body as Record<string, unknown>)
        : undefined;
    const bodyPayload =
      request.idempotencyKey && bodyRecord
        ? withIdempotencyKey(bodyRecord, request.idempotencyKey)
        : request.body;

    const body = bodyPayload === undefined ? undefined : yield* serializeBodyEffect(bodyPayload);
    if (body !== undefined) {
      headers["content-type"] = headers["content-type"] ?? "application/json";
    }

    const response = yield* Effect.tryPromise({
      try: () =>
        fetcher(url.toString(), {
          method: request.method,
          headers,
          body,
          signal: request.signal
        }),
      catch: (error) => {
        if (request.signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return new ClientSdkTransportError({
            stage: "aborted",
            message: "Request was aborted"
          });
        }

        return new ClientSdkTransportError({
          stage: "fetch",
          message: toErrorMessage(error)
        });
      }
    });

    const responseBody = yield* readResponseBodyEffect(response, request.signal);

    return {
      status: response.status,
      headers: safeHeadersFrom(response.headers),
      body: responseBody
    };
  });
}

function isMutatingMethod(method: HttpMethod): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH";
}

function isRetryableStatus(status: number, retryKind: "get" | "mutate" | "none"): boolean {
  if (retryKind === "get") {
    return GET_RETRYABLE_STATUSES.has(status);
  }

  if (retryKind === "mutate") {
    return MUTATE_RETRYABLE_STATUSES.has(status);
  }

  return false;
}

function resolveTokenEffect(
  getToken?: () => string | null | undefined | Promise<string | null | undefined>,
  options: { readonly required?: boolean } = {}
): Effect.Effect<string | null, ClientSdkTransportError> {
  if (!getToken) {
    return Effect.succeed(null);
  }

  return Effect.gen(function* () {
    const token = yield* Effect.tryPromise({
      try: async () => (await getToken()) ?? null,
      catch: (error) =>
        new ClientSdkTransportError({
          stage: "token",
          message: toErrorMessage(error)
        })
    });

    if (options.required && (!token || token.trim().length === 0)) {
      return yield* Effect.fail(
        new ClientSdkTransportError({
          stage: "token",
          message: "Access token is required but missing"
        })
      );
    }

    return token;
  });
}

function serializeBodyEffect(body: unknown): Effect.Effect<string, ClientSdkTransportError> {
  return Effect.try({
    try: () => JSON.stringify(body),
    catch: (error) =>
      new ClientSdkTransportError({
        stage: "body",
        message: toErrorMessage(error)
      })
  });
}

function sleepMs(ms: number, signal?: AbortSignal): Effect.Effect<void, ClientSdkTransportError> {
  return Effect.tryPromise({
    try: () =>
      new Promise<void>((resolve, reject) => {
        if (signal?.aborted) {
          reject(new Error("aborted"));
          return;
        }

        const timer = setTimeout(() => {
          signal?.removeEventListener("abort", onAbort);
          resolve();
        }, ms);

        const onAbort = () => {
          clearTimeout(timer);
          reject(new Error("aborted"));
        };

        signal?.addEventListener("abort", onAbort, { once: true });
      }),
    catch: () =>
      new ClientSdkTransportError({
        stage: "aborted",
        message: "Request was aborted"
      })
  });
}

function safeHeadersFrom(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function openSseEffect(
  config: ReturnType<typeof resolveClientSdkConfig>,
  fetcher: typeof fetch,
  path: string,
  signal?: AbortSignal
): Effect.Effect<Response, ClientSdkTransportError> {
  return Effect.gen(function* () {
    const token = yield* resolveTokenEffect(config.getToken, { required: Boolean(config.getToken) });
    const headers: Record<string, string> = {
      accept: "text/event-stream",
      ...config.headers
    };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    if (signal?.aborted) {
      return yield* Effect.fail(
        new ClientSdkTransportError({
          stage: "aborted",
          message: "Request was aborted"
        })
      );
    }

    return yield* Effect.tryPromise({
      try: () =>
        fetcher(new URL(path, config.baseUrl).toString(), {
          method: "GET",
          headers,
          signal
        }),
      catch: (error) => {
        if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return new ClientSdkTransportError({
            stage: "aborted",
            message: "Request was aborted"
          });
        }

        return new ClientSdkTransportError({
          stage: "fetch",
          message: toErrorMessage(error)
        });
      }
    });
  });
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
