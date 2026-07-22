import { Effect } from "effect";
import { decodeMePracticeProfileResponse, type MePracticeProfileResponse } from "@my-ai-orchestrator/contracts";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
import type { HttpTransport } from "./transport.js";

export interface PracticeProfileGetInput {
  readonly signal?: AbortSignal;
}

export interface PracticeProfileClient {
  readonly get: (input?: PracticeProfileGetInput) => Effect.Effect<MePracticeProfileResponse, ClientSdkError>;
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
    }
  };
}
