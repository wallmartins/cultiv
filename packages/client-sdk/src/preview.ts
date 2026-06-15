import { Effect } from "effect";
import {
  decodeGenerationPreviewRequest,
  decodeGenerationPreviewResponse,
  type GenerationPreviewRequest,
  type GenerationPreviewResponse
} from "@my-ai-orchestrator/contracts";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
import { ClientSdkInvalidRequestError } from "./errors.js";
import type { HttpTransport } from "./transport.js";

export interface PreviewGetInput extends GenerationPreviewRequest {
  readonly signal?: AbortSignal;
}

export interface PreviewClient {
  readonly get: (
    input: PreviewGetInput
  ) => Effect.Effect<GenerationPreviewResponse, ClientSdkError>;
}

export function createPreviewClient(transport: HttpTransport): PreviewClient {
  return {
    get(input) {
      return Effect.gen(function* () {
        const { signal, ...request } = input;
        const validated = yield* decodeGenerationPreviewRequest(request).pipe(
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
          path: "/api/generation-preview",
          body: validated,
          signal
        });

        return yield* decodeOkResponseEffect(response, "generation preview", decodeGenerationPreviewResponse);
      });
    }
  };
}
