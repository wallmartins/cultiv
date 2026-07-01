import { Effect } from "effect";
import {
  decodeConfirmWizardReviewInput,
  decodeSetWizardContextInput,
  decodeSubmitWizardStepInput,
  decodeVoiceCalibrationEntitlementView,
  decodeVoiceCalibrationSessionView,
  decodeVoiceCalibrationStepPromptView,
  type ConfirmWizardReviewInput,
  type SetWizardContextInput,
  type VoiceCalibrationEntitlementView,
  type VoiceCalibrationSessionView,
  type VoiceCalibrationStepPromptView
} from "@my-ai-orchestrator/contracts";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
import { ClientSdkInvalidRequestError } from "./errors.js";
import { createIdempotencyKey } from "./idempotency.js";
import type { HttpTransport } from "./transport.js";

export interface VoiceCalibrationStartSessionInput {
  readonly signal?: AbortSignal;
}

export interface VoiceCalibrationSessionInput {
  readonly sessionId: string;
  readonly signal?: AbortSignal;
}

export interface VoiceCalibrationSetContextInput extends SetWizardContextInput {
  readonly sessionId: string;
  readonly signal?: AbortSignal;
}

export interface VoiceCalibrationStepInput {
  readonly sessionId: string;
  readonly stepId: string;
  readonly signal?: AbortSignal;
}

export interface VoiceCalibrationSubmitStepInput {
  readonly sessionId: string;
  readonly stepId: string;
  readonly text: string;
  readonly signal?: AbortSignal;
}

export interface VoiceCalibrationCompleteReviewInput extends ConfirmWizardReviewInput {
  readonly sessionId: string;
  readonly signal?: AbortSignal;
}

export interface VoiceCalibrationEntitlementInput {
  readonly signal?: AbortSignal;
}

export interface VoiceCalibrationClient {
  readonly startSession: (
    input?: VoiceCalibrationStartSessionInput
  ) => Effect.Effect<VoiceCalibrationSessionView, ClientSdkError>;
  readonly getSession: (
    input: VoiceCalibrationSessionInput
  ) => Effect.Effect<VoiceCalibrationSessionView, ClientSdkError>;
  readonly setContext: (
    input: VoiceCalibrationSetContextInput
  ) => Effect.Effect<VoiceCalibrationSessionView, ClientSdkError>;
  readonly getStepPrompt: (
    input: VoiceCalibrationStepInput
  ) => Effect.Effect<VoiceCalibrationStepPromptView, ClientSdkError>;
  readonly submitStep: (
    input: VoiceCalibrationSubmitStepInput
  ) => Effect.Effect<VoiceCalibrationSessionView, ClientSdkError>;
  readonly skipStep: (
    input: VoiceCalibrationStepInput
  ) => Effect.Effect<VoiceCalibrationSessionView, ClientSdkError>;
  readonly completeReview: (
    input: VoiceCalibrationCompleteReviewInput
  ) => Effect.Effect<VoiceCalibrationSessionView, ClientSdkError>;
  readonly getEntitlement: (
    input?: VoiceCalibrationEntitlementInput
  ) => Effect.Effect<VoiceCalibrationEntitlementView, ClientSdkError>;
}

export function createVoiceCalibrationClient(transport: HttpTransport): VoiceCalibrationClient {
  return {
    startSession(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: "/me/voice-calibration/sessions",
          signal: input.signal,
          idempotencyKey: createIdempotencyKey()
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice calibration session start",
          decodeVoiceCalibrationSessionView
        );
      });
    },

    getSession(input) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: `/me/voice-calibration/sessions/${encodeURIComponent(input.sessionId)}`,
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice calibration session",
          decodeVoiceCalibrationSessionView
        );
      });
    },

    setContext(input) {
      return Effect.gen(function* () {
        const { sessionId, signal, ...request } = input;
        const validated = yield* decodeSetWizardContextInput(request).pipe(
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
          path: `/me/voice-calibration/sessions/${encodeURIComponent(sessionId)}/context`,
          body: validated,
          signal
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice calibration context",
          decodeVoiceCalibrationSessionView
        );
      });
    },

    getStepPrompt(input) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: `/me/voice-calibration/sessions/${encodeURIComponent(input.sessionId)}/steps/${encodeURIComponent(input.stepId)}`,
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice calibration step prompt",
          decodeVoiceCalibrationStepPromptView
        );
      });
    },

    submitStep(input) {
      return Effect.gen(function* () {
        const { sessionId, stepId, text, signal } = input;
        const validated = yield* decodeSubmitWizardStepInput({ stepId, text }).pipe(
          Effect.mapError(
            (error) =>
              new ClientSdkInvalidRequestError({
                message: error.message,
                request: { stepId, text }
              })
          )
        );

        const response = yield* transport.send({
          method: "POST",
          path: `/me/voice-calibration/sessions/${encodeURIComponent(sessionId)}/steps/${encodeURIComponent(stepId)}/submit`,
          body: validated,
          signal,
          idempotencyKey: createIdempotencyKey()
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice calibration step submit",
          decodeVoiceCalibrationSessionView
        );
      });
    },

    skipStep(input) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: `/me/voice-calibration/sessions/${encodeURIComponent(input.sessionId)}/steps/${encodeURIComponent(input.stepId)}/skip`,
          signal: input.signal,
          idempotencyKey: createIdempotencyKey()
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice calibration step skip",
          decodeVoiceCalibrationSessionView
        );
      });
    },

    completeReview(input) {
      return Effect.gen(function* () {
        const { sessionId, signal, ...request } = input;
        const validated = yield* decodeConfirmWizardReviewInput(request).pipe(
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
          path: `/me/voice-calibration/sessions/${encodeURIComponent(sessionId)}/complete`,
          body: validated,
          signal,
          idempotencyKey: createIdempotencyKey()
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice calibration complete",
          decodeVoiceCalibrationSessionView
        );
      });
    },

    getEntitlement(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/voice-calibration/entitlement",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(
          response,
          "voice calibration entitlement",
          decodeVoiceCalibrationEntitlementView
        );
      });
    }
  };
}
