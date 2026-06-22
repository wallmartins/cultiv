import { Effect } from "effect";
import { decodeGenerationIntentCatalogView, type GenerationIntentCatalogView } from "@my-ai-orchestrator/contracts";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
import type { HttpTransport } from "./transport.js";

export interface GenerationIntentsListInput {
  readonly signal?: AbortSignal;
}

export interface GenerationIntentsClient {
  readonly list: (input?: GenerationIntentsListInput) => Effect.Effect<GenerationIntentCatalogView, ClientSdkError>;
}

export function createGenerationIntentsClient(transport: HttpTransport): GenerationIntentsClient {
  return {
    list(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/generation-intents",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "generation intents", decodeGenerationIntentCatalogView);
      });
    }
  };
}
