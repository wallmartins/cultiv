import { Effect } from "effect";
import {
  decodeGenreInferenceRequest,
  decodeGenreInferenceResponse,
  type GenreInferenceRequest,
  type GenreInferenceResponse
} from "@my-ai-orchestrator/contracts";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
import { ClientSdkInvalidRequestError } from "./errors.js";
import type { HttpTransport } from "./transport.js";

export interface GenreInferenceInferInput extends GenreInferenceRequest {
  readonly signal?: AbortSignal;
}

export interface GenreInferenceClient {
  readonly infer: (
    input: GenreInferenceInferInput
  ) => Effect.Effect<GenreInferenceResponse, ClientSdkError>;
}

export function createGenreInferenceClient(transport: HttpTransport): GenreInferenceClient {
  return {
    infer(input) {
      return Effect.gen(function* () {
        const { signal, ...request } = input;
        const validated = yield* decodeGenreInferenceRequest(request).pipe(
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
          path: "/me/genre-inference",
          body: validated,
          signal
        });

        return yield* decodeOkResponseEffect(response, "genre inference", decodeGenreInferenceResponse);
      });
    }
  };
}
