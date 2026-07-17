import { Effect } from "effect";
import {
  decodeGenerationPrefillRequest,
  decodeGenerationPrefillResponse,
  type GenerationPrefillRequest,
  type GenerationPrefillResponse
} from "@my-ai-orchestrator/contracts";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
import { ClientSdkInvalidRequestError } from "./errors.js";
import type { HttpTransport } from "./transport.js";

export interface GenerationPrefillInferInput extends GenerationPrefillRequest {
  readonly signal?: AbortSignal;
}

export interface GenerationPrefillClient {
  readonly infer: (
    input: GenerationPrefillInferInput
  ) => Effect.Effect<GenerationPrefillResponse, ClientSdkError>;
}

export function createGenerationPrefillClient(transport: HttpTransport): GenerationPrefillClient {
  return {
    infer(input) {
      return Effect.gen(function* () {
        const { signal, ...request } = input;
        const validated = yield* decodeGenerationPrefillRequest(request).pipe(
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
          path: "/me/generation-prefill",
          body: validated,
          signal
        });

        return yield* decodeOkResponseEffect(response, "generation prefill", decodeGenerationPrefillResponse);
      });
    }
  };
}
