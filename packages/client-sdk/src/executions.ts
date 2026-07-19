import { Effect } from "effect";
import {
  decodeExecutionReactionView,
  decodeExecutionsPageView,
  decodeExecutionStatusView,
  decodeMeExecutionRequest,
  decodeQueuedExecutionView,
  type ExecutionReactionValue,
  type ExecutionReactionView,
  type ExecutionsListPeriod,
  type ExecutionsListStatusFilter,
  type ExecutionsPageView,
  type ExecutionStatusView,
  type MeExecutionRequest,
  type QueuedExecutionView
} from "@my-ai-orchestrator/contracts";
import type { ClientSdkConfig } from "./config.js";
import { assertOkResponseEffect, decodeOkResponseEffect } from "./decode-response.js";
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
  readonly period?: ExecutionsListPeriod;
  readonly status?: ExecutionsListStatusFilter;
  readonly contentType?: string;
  readonly intent?: string;
  readonly lengthTier?: string;
  readonly q?: string;
  readonly signal?: AbortSignal;
}

export interface ExecutionsSubmitReactionInput {
  readonly executionId: string;
  readonly reaction: ExecutionReactionValue;
  readonly reason?: string;
  readonly signal?: AbortSignal;
}

export interface ExecutionsClearReactionInput {
  readonly executionId: string;
  readonly signal?: AbortSignal;
}

export interface ExecutionsCancelInput {
  readonly executionId: string;
  readonly reason?: string;
  readonly signal?: AbortSignal;
}

export interface ExecutionsClient {
  readonly create: (input: ExecutionsCreateInput) => Effect.Effect<QueuedExecutionView, ClientSdkError>;
  readonly get: (input: ExecutionsGetInput) => Effect.Effect<ExecutionStatusView, ClientSdkError>;
  readonly list: (input?: ExecutionsListInput) => Effect.Effect<ExecutionsPageView, ClientSdkError>;
  readonly watch: (input: ExecutionWatchInput) => ObservationHandle;
  readonly submitReaction: (
    input: ExecutionsSubmitReactionInput
  ) => Effect.Effect<ExecutionReactionView, ClientSdkError>;
  readonly clearReaction: (input: ExecutionsClearReactionInput) => Effect.Effect<void, ClientSdkError>;
  readonly cancel: (input: ExecutionsCancelInput) => Effect.Effect<ExecutionStatusView, ClientSdkError>;
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
            offset: input.offset,
            period: input.period,
            status: input.status,
            contentType: input.contentType,
            intent: input.intent,
            lengthTier: input.lengthTier,
            q: input.q
          },
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "executions list", decodeExecutionsPageView);
      });
    },

    watch(input) {
      return startExecutionWatch(config, transport, input);
    },

    submitReaction(input) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: `/me/executions/${encodeURIComponent(input.executionId)}/reaction`,
          body: { reaction: input.reaction, ...(input.reason ? { reason: input.reason } : {}) },
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "execution reaction submit", decodeExecutionReactionView);
      });
    },

    clearReaction(input) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "DELETE",
          path: `/me/executions/${encodeURIComponent(input.executionId)}/reaction`,
          signal: input.signal
        });

        yield* assertOkResponseEffect(response, "execution reaction clear");
      });
    },

    cancel(input) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: `/me/executions/${encodeURIComponent(input.executionId)}/cancel`,
          body: input.reason ? { reason: input.reason } : {},
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "execution cancel", decodeExecutionStatusView);
      });
    }
  };
}
