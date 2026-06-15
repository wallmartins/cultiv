import { Effect } from "effect";
import { decodeContentTypeCatalogView, type ContentTypeCatalogView } from "@my-ai-orchestrator/contracts";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
import type { HttpTransport } from "./transport.js";

export interface ContentTypesListInput {
  readonly signal?: AbortSignal;
}

export interface ContentTypesClient {
  readonly list: (input?: ContentTypesListInput) => Effect.Effect<ContentTypeCatalogView, ClientSdkError>;
}

export function createContentTypesClient(transport: HttpTransport): ContentTypesClient {
  return {
    list(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/content-types",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "content types", decodeContentTypeCatalogView);
      });
    }
  };
}
