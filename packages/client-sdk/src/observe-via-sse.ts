import { Effect } from "effect";
import type { ExecutionSseEvent, ExecutionTransition } from "@my-ai-orchestrator/contracts";
import { ClientSdkTransportError } from "./errors.js";
import { mapSseEventToTransition } from "./execution-transitions.js";
import { consumeSseStream } from "./sse-parser.js";
import type { HttpTransport } from "./transport.js";

export function observeViaSseEffect(
  transport: HttpTransport,
  executionId: string,
  onTransition: (transition: ExecutionTransition) => void,
  signal: AbortSignal
): Effect.Effect<boolean, ClientSdkTransportError> {
  return Effect.gen(function* () {
    const response = yield* transport.openSse(
      `/me/executions/${encodeURIComponent(executionId)}/events`,
      signal
    );

    if (!response.ok || !response.headers.get("content-type")?.includes("text/event-stream")) {
      return false;
    }

    let terminal = false;

    yield* Effect.tryPromise({
      try: () =>
        consumeSseStream(
          response,
          (event) => {
            const transition = mapSseEventToTransition(executionId, event);
            if (!transition) {
              return;
            }
            onTransition(transition);
            if (transition.type === "completed" || transition.type === "failed" || transition.type === "cancelled") {
              terminal = true;
            }
          },
          signal
        ),
      catch: (error) => {
        if (signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return new ClientSdkTransportError({
            stage: "aborted",
            message: "Observation was aborted"
          });
        }
        return new ClientSdkTransportError({
          stage: "fetch",
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });

    return terminal;
  });
}
