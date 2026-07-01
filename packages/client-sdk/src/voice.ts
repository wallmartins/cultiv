import { Effect } from "effect";
import {
  decodeVoiceExamplesPageView,
  decodeVoiceProfileScreenView,
  decodeVoiceProfileDiagnosticsView,
  decodeVoiceTrainingConsentStatusView,
  decodeTraitConfirmationInput,
  type TraitConfirmationInput,
  type VoiceProfileDiagnosticsView,
  type VoiceExamplesPageView,
  type VoiceProfileScreenView,
  type VoiceTrainingConsentStatusView
} from "@my-ai-orchestrator/contracts";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
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
          signal: input.signal,
          idempotencyKey: createIdempotencyKey()
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
        const validated = yield* decodeTraitConfirmationInput(request);

        const response = yield* transport.send({
          method: "POST",
          path: "/me/voice-profile/trait-confirmations",
          body: validated,
          signal,
          idempotencyKey: createIdempotencyKey()
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
        const params = new URLSearchParams();
        if (input.limit !== undefined) {
          params.set("limit", String(input.limit));
        }
        if (input.offset !== undefined) {
          params.set("offset", String(input.offset));
        }

        const query = params.toString();
        const response = yield* transport.send({
          method: "GET",
          path: query.length > 0 ? `/me/voice-profile/examples?${query}` : "/me/voice-profile/examples",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "voice examples list", decodeVoiceExamplesPageView);
      });
    }
  };
}
