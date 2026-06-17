import { Effect } from "effect";
import {
  decodeVoiceExampleBatchCommitResultView,
  decodeVoiceExampleBatchView,
  decodeVoiceExampleCreateInput,
  decodeVoiceExampleListItemView,
  decodeVoiceExampleUpdateInput,
  decodeVoiceExamplesPageView,
  decodeVoiceProfileScreenView,
  decodeVoiceProfileDiagnosticsView,
  decodeVoiceTrainingConsentStatusView,
  decodeTraitConfirmationInput,
  type TraitConfirmationInput,
  type VoiceProfileDiagnosticsView,
  type VoiceExampleBatchCommitResultView,
  type VoiceExampleBatchView,
  type VoiceExampleCreateInput,
  type VoiceExampleListItemView,
  type VoiceExampleUpdateInput,
  type VoiceExamplesPageView,
  type VoiceProfileScreenView,
  type VoiceTrainingConsentStatusView
} from "@my-ai-orchestrator/contracts";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
import { ClientSdkInvalidRequestError } from "./errors.js";
import { createIdempotencyKey } from "./idempotency.js";
import type { HttpTransport } from "./transport.js";

export interface VoiceGetProfileInput {
  readonly signal?: AbortSignal;
}

export interface VoiceConsentInput {
  readonly signal?: AbortSignal;
}

export interface VoiceListExamplesInput {
  readonly limit?: number;
  readonly offset?: number;
  readonly signal?: AbortSignal;
}

export interface VoiceCreateExampleInput extends VoiceExampleCreateInput {
  readonly signal?: AbortSignal;
}

export interface VoiceUpdateExampleInput extends VoiceExampleUpdateInput {
  readonly exampleId: string;
  readonly signal?: AbortSignal;
}

export interface VoiceCreateBatchInput {
  readonly expiresAt?: string;
  readonly signal?: AbortSignal;
}

export interface VoiceAddBatchItemsInput {
  readonly batchId: string;
  readonly items: ReadonlyArray<{
    readonly clientItemId: string;
    readonly input: VoiceExampleCreateInput;
  }>;
  readonly signal?: AbortSignal;
}

export interface VoiceCommitBatchInput {
  readonly batchId: string;
  readonly signal?: AbortSignal;
}

export interface VoiceTraitConfirmationInput extends TraitConfirmationInput {
  readonly signal?: AbortSignal;
}

export interface VoiceClient {
  readonly getConsentStatus: (input?: VoiceConsentInput) => Effect.Effect<VoiceTrainingConsentStatusView, ClientSdkError>;
  readonly grantConsent: (input?: VoiceConsentInput) => Effect.Effect<VoiceTrainingConsentStatusView, ClientSdkError>;
  readonly getProfile: (input?: VoiceGetProfileInput) => Effect.Effect<VoiceProfileScreenView, ClientSdkError>;
  readonly recordTraitConfirmation: (
    input: VoiceTraitConfirmationInput
  ) => Effect.Effect<VoiceProfileDiagnosticsView, ClientSdkError>;
  readonly listExamples: (input?: VoiceListExamplesInput) => Effect.Effect<VoiceExamplesPageView, ClientSdkError>;
  readonly createExample: (input: VoiceCreateExampleInput) => Effect.Effect<VoiceExampleListItemView, ClientSdkError>;
  readonly updateExample: (input: VoiceUpdateExampleInput) => Effect.Effect<VoiceExampleListItemView, ClientSdkError>;
  readonly createBatch: (input?: VoiceCreateBatchInput) => Effect.Effect<VoiceExampleBatchView, ClientSdkError>;
  readonly addBatchItems: (input: VoiceAddBatchItemsInput) => Effect.Effect<VoiceExampleBatchView, ClientSdkError>;
  readonly commitBatch: (input: VoiceCommitBatchInput) => Effect.Effect<VoiceExampleBatchCommitResultView, ClientSdkError>;
}

export function createVoiceClient(transport: HttpTransport): VoiceClient {
  return {
    getConsentStatus(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/voice-training-consent",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice training consent status",
          decodeVoiceTrainingConsentStatusView
        );
      });
    },

    grantConsent(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: "/me/voice-training-consent",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice training consent grant",
          decodeVoiceTrainingConsentStatusView
        );
      });
    },

    getProfile(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/voice-profile",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "voice profile", decodeVoiceProfileScreenView);
      });
    },

    recordTraitConfirmation(input) {
      return Effect.gen(function* () {
        const { signal, ...request } = input;
        const validated = yield* decodeTraitConfirmationInput(request).pipe(
          Effect.mapError(
            (error) =>
              new ClientSdkInvalidRequestError({
                message: error.message,
                request
              })
          )
        );

        const response = yield* transport.send({
          method: "POST",
          path: "/me/voice-profile/trait-confirmations",
          body: validated,
          signal
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice trait confirmation",
          decodeVoiceProfileDiagnosticsView
        );
      });
    },

    listExamples(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/voice-profile/examples",
          query: {
            limit: input.limit,
            offset: input.offset
          },
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "voice examples", decodeVoiceExamplesPageView);
      });
    },

    createExample(input) {
      return Effect.gen(function* () {
        const { signal, ...request } = input;
        const validated = yield* decodeVoiceExampleCreateInput(request).pipe(
          Effect.mapError(
            (error) =>
              new ClientSdkInvalidRequestError({
                message: error.message,
                request
              })
          )
        );

        const response = yield* transport.send({
          method: "POST",
          path: "/me/voice-profile/examples",
          body: validated,
          signal,
          idempotencyKey: createIdempotencyKey()
        });

        return yield* decodeOkResponseEffect(response, "voice example create", decodeVoiceExampleListItemView);
      });
    },

    updateExample(input) {
      return Effect.gen(function* () {
        const { exampleId, signal, ...request } = input;
        const validated = yield* decodeVoiceExampleUpdateInput(request).pipe(
          Effect.mapError(
            (error) =>
              new ClientSdkInvalidRequestError({
                message: error.message,
                request
              })
          )
        );

        const response = yield* transport.send({
          method: "PATCH",
          path: `/me/voice-profile/examples/${encodeURIComponent(exampleId)}`,
          body: validated,
          signal,
          idempotencyKey: createIdempotencyKey()
        });

        return yield* decodeOkResponseEffect(response, "voice example update", decodeVoiceExampleListItemView);
      });
    },

    createBatch(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: "/me/voice-profile/example-batches",
          body: input.expiresAt ? { expiresAt: input.expiresAt } : {},
          signal: input.signal,
          idempotencyKey: createIdempotencyKey()
        });

        return yield* decodeOkResponseEffect(response, "voice batch create", decodeVoiceExampleBatchView);
      });
    },

    addBatchItems(input) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: `/me/voice-profile/example-batches/${encodeURIComponent(input.batchId)}/items`,
          body: { items: input.items },
          signal: input.signal,
          idempotencyKey: createIdempotencyKey()
        });

        return yield* decodeOkResponseEffect(response, "voice batch items", decodeVoiceExampleBatchView);
      });
    },

    commitBatch(input) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: `/me/voice-profile/example-batches/${encodeURIComponent(input.batchId)}/commit`,
          signal: input.signal,
          idempotencyKey: createIdempotencyKey()
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice batch commit",
          decodeVoiceExampleBatchCommitResultView
        );
      });
    }
  };
}
