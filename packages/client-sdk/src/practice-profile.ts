import { Effect } from "effect";
import {
  decodeMePracticeIdentityResponse,
  decodeMePracticeProfileResponse,
  decodeNicheAskResponseInput,
  decodeUpdateDeclaredAxesInput,
  type MePracticeIdentityResponse,
  type MePracticeProfileResponse,
  type NicheAskResponseInput,
  type UpdateDeclaredAxesInput
} from "@my-ai-orchestrator/contracts";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
import { ClientSdkInvalidRequestError } from "./errors.js";
import { createIdempotencyKey } from "./idempotency.js";
import type { HttpTransport } from "./transport.js";

export interface PracticeProfileGetInput {
  readonly signal?: AbortSignal;
}

export interface PracticeIdentityGetInput {
  readonly locale?: string;
  readonly signal?: AbortSignal;
}

export interface UpdateDeclaredAxesClientInput extends UpdateDeclaredAxesInput {
  // Sent as a `?locale=` query param (not body) so the backend re-seed generates in the author's
  // language — mirrors getIdentity, and matches how the routes read `c.req.query("locale")`.
  readonly locale?: string;
  readonly signal?: AbortSignal;
}

export type NicheAskResponseClientInput = NicheAskResponseInput & {
  readonly locale?: string;
  readonly signal?: AbortSignal;
};

export interface PracticeProfileClient {
  // F4-2 · declared axes only (generation audience-narrowing hot path).
  readonly get: (input?: PracticeProfileGetInput) => Effect.Effect<MePracticeProfileResponse, ClientSdkError>;
  // F5-1 · the /voice identity read (declared axes + depth + pending niche-ask).
  readonly getIdentity: (input?: PracticeIdentityGetInput) => Effect.Effect<MePracticeIdentityResponse, ClientSdkError>;
  // F5-2(a) · edit the declared axes in-place (may re-seed server-side).
  readonly updateDeclaredAxes: (
    input: UpdateDeclaredAxesClientInput
  ) => Effect.Effect<MePracticeIdentityResponse, ClientSdkError>;
  // F5-2(b)/F5-3 · answer or dismiss the niche-ask.
  readonly respondToNicheAsk: (
    input: NicheAskResponseClientInput
  ) => Effect.Effect<MePracticeIdentityResponse, ClientSdkError>;
}

export function createPracticeProfileClient(transport: HttpTransport): PracticeProfileClient {
  return {
    get(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/practice-profile",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "practice profile", decodeMePracticeProfileResponse);
      });
    },

    getIdentity(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/practice-identity",
          query: input.locale ? { locale: input.locale } : undefined,
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "practice identity", decodeMePracticeIdentityResponse);
      });
    },

    updateDeclaredAxes(input) {
      return Effect.gen(function* () {
        const { signal, locale, ...request } = input;
        const validated = yield* decodeUpdateDeclaredAxesInput(request).pipe(
          Effect.mapError((error) => new ClientSdkInvalidRequestError({ message: error.message, request }))
        );

        const response = yield* transport.send({
          method: "POST",
          path: "/me/practice-profile/declaration",
          query: locale ? { locale } : undefined,
          body: validated,
          signal,
          idempotencyKey: createIdempotencyKey()
        });

        return yield* decodeOkResponseEffect(response, "practice declaration", decodeMePracticeIdentityResponse);
      });
    },

    respondToNicheAsk(input) {
      return Effect.gen(function* () {
        const { signal, locale, ...request } = input;
        const validated = yield* decodeNicheAskResponseInput(request).pipe(
          Effect.mapError((error) => new ClientSdkInvalidRequestError({ message: error.message, request }))
        );

        const response = yield* transport.send({
          method: "POST",
          path: "/me/practice-profile/niche-ask",
          query: locale ? { locale } : undefined,
          body: validated,
          signal,
          idempotencyKey: createIdempotencyKey()
        });

        return yield* decodeOkResponseEffect(response, "practice niche-ask", decodeMePracticeIdentityResponse);
      });
    }
  };
}
