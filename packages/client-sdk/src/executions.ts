import { Effect } from "effect";
import {
  decodeExecutionsPageView,
  decodeExecutionStatusView,
  decodeMeExecutionRequest,
  decodeQueuedExecutionView,
  type ExecutionsPageView,
  type ExecutionStatusView,
  type MeExecutionRequest,
  type QueuedExecutionView
} from "@my-ai-orchestrator/contracts";
import type { ClientSdkConfig } from "./config.js";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
import { ClientSdkInvalidRequestError } from "./errors.js";
import { startExecutionWatch, type ExecutionWatchInput, type ObservationHandle } from "./execution-watch.js";
import { createIdempotencyKey } from "./idempotency.js";
import type { HttpTransport } from "./transport.js";

export interface ExecutionsCreateInput extends MeExecutionRequest {
  readonly signal?: AbortSignal;
}

export interface ExecutionsGetInput {
  readonly executionId: string;
  readonly signal?: AbortSignal;
}

export interface ExecutionsListInput {
  readonly limit?: number;
  readonly offset?: number;
  readonly signal?: AbortSignal;
}

export interface ExecutionsClient {
  readonly create: (input: ExecutionsCreateInput) => Effect.Effect<QueuedExecutionView, ClientSdkError>;
  readonly get: (input: ExecutionsGetInput) => Effect.Effect<ExecutionStatusView, ClientSdkError>;
  readonly list: (input?: ExecutionsListInput) => Effect.Effect<ExecutionsPageView, ClientSdkError>;
  readonly watch: (input: ExecutionWatchInput) => ObservationHandle;
}

export function createExecutionsClient(config: ClientSdkConfig, transport: HttpTransport): ExecutionsClient {
  return {
    create(input) {
      return Effect.gen(function* () {
        const { signal, idempotencyKey: _ignored, ...request } = input;
        const validated = yield* decodeMeExecutionRequest(request).pipe(
          Effect.mapError(
            (error) =>
              new ClientSdkInvalidRequestError({
                message: error.message,
                request
              })
          )
        );
        const idempotencyKey = createIdempotencyKey();

        const response = yield* transport.send({
          method: "POST",
          path: "/me/executions/run",
          body: validated,
          signal,
          idempotencyKey
        });

        return yield* decodeOkResponseEffect(response, "execution create", decodeQueuedExecutionView);
      });
    },

    get(input) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: `/me/executions/${encodeURIComponent(input.executionId)}`,
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "execution status", decodeExecutionStatusView);
      });
    },

    list(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/executions",
          query: {
            limit: input.limit,
            offset: input.offset
          },
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "executions list", decodeExecutionsPageView);
      });
    },

    watch(input) {
      return startExecutionWatch(config, transport, input);
    }
  };
}
