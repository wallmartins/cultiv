import { Effect } from "effect";
import {
  decodeVoiceProfileScreenView,
  decodeVoiceProfileDiagnosticsView,
  decodeVoiceTrainingConsentStatusView,
  decodeTraitConfirmationInput,
  type TraitConfirmationInput,
  type VoiceProfileDiagnosticsView,
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

export interface VoiceTraitConfirmationInput extends TraitConfirmationInput {
  readonly signal?: AbortSignal;
}

export interface VoiceClient {
  readonly getConsentStatus: (input?: VoiceConsentInput) => Effect.Effect<VoiceTrainingConsentStatusView, ClientSdkError>;
  readonly grantConsent: (input?: VoiceConsentInput) => Effect.Effect<VoiceTrainingConsentStatusView, ClientSdkError>;
  readonly revokeConsent: (input?: VoiceConsentInput) => Effect.Effect<VoiceTrainingConsentStatusView, ClientSdkError>;
  readonly getProfile: (input?: VoiceGetProfileInput) => Effect.Effect<VoiceProfileScreenView, ClientSdkError>;
  readonly recordTraitConfirmation: (
    input: VoiceTraitConfirmationInput
  ) => Effect.Effect<VoiceProfileDiagnosticsView, ClientSdkError>;
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
          idempotencyKey: createIdempotencyKey(),
          body: { action: "grant" }
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice training consent grant",
          decodeVoiceTrainingConsentStatusView
        );
      });
    },

    revokeConsent(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: "/me/voice-training-consent",
          signal: input.signal,
          idempotencyKey: createIdempotencyKey(),
          body: { action: "revoke" }
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice training consent revoke",
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

  };
}
