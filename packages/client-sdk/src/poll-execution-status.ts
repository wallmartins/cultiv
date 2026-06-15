import { Effect } from "effect";
import { decodeExecutionStatusView } from "@my-ai-orchestrator/contracts";
import type { ExecutionStatusView } from "@my-ai-orchestrator/contracts";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkContractFailure, ClientSdkHttpStatusError, ClientSdkResponseDecodeError, ClientSdkTransportError } from "./errors.js";
import type { HttpTransport } from "./transport.js";

export function pollExecutionStatusEffect(
  transport: HttpTransport,
  executionId: string,
  signal: AbortSignal
): Effect.Effect<ExecutionStatusView, ClientSdkTransportError | ClientSdkHttpStatusError | ClientSdkResponseDecodeError | ClientSdkContractFailure> {
  return Effect.gen(function* () {
    const response = yield* transport.send({
      method: "GET",
      path: `/me/executions/${encodeURIComponent(executionId)}`,
      signal
    });
    return yield* decodeOkResponseEffect(response, "execution status", decodeExecutionStatusView);
  });
}
