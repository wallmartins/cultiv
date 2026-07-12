import { Effect } from "effect";
import { decodeOnboardingStatusView, type OnboardingStatusView } from "@my-ai-orchestrator/contracts";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
import { createIdempotencyKey } from "./idempotency.js";
import type { HttpTransport } from "./transport.js";

export interface OnboardingCompleteInput {
  readonly signal?: AbortSignal;
}

export interface OnboardingGetStatusInput {
  readonly signal?: AbortSignal;
}

export interface OnboardingClient {
  readonly complete: (input?: OnboardingCompleteInput) => Effect.Effect<OnboardingStatusView, ClientSdkError>;
  readonly getStatus: (input?: OnboardingGetStatusInput) => Effect.Effect<OnboardingStatusView, ClientSdkError>;
}

export function createOnboardingClient(transport: HttpTransport): OnboardingClient {
  return {
    complete(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: "/me/onboarding/complete",
          signal: input.signal,
          idempotencyKey: createIdempotencyKey()
        });

        return yield* decodeOkResponseEffect(response, "onboarding complete", decodeOnboardingStatusView);
      });
    },

    getStatus(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/onboarding/status",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "onboarding status", decodeOnboardingStatusView);
      });
    }
  };
}
