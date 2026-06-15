import { Effect } from "effect";
import { decodeExecutionSseEvent, type ExecutionSseEvent } from "@my-ai-orchestrator/contracts";
import { ClientSdkContractFailure, ClientSdkTransportError } from "./errors.js";

export function parseSseChunk(
  buffer: string,
  onEvent: (event: ExecutionSseEvent) => void
): Effect.Effect<string, ClientSdkContractFailure> {
  return Effect.gen(function* () {
    const parts = buffer.split("\n\n");
    const remainder = parts.pop() ?? "";

    for (const part of parts) {
      const dataLine = part
        .split("\n")
        .find((line) => line.startsWith("data:"))
        ?.slice("data:".length)
        .trim();

      if (!dataLine) {
        continue;
      }

      const parsed = yield* Effect.try({
        try: () => JSON.parse(dataLine) as unknown,
        catch: (error) =>
          new ClientSdkContractFailure({
            label: "execution sse event json",
            message: toErrorMessage(error),
            body: dataLine
          })
      });

      const decoded = yield* decodeExecutionSseEvent(parsed).pipe(
        Effect.mapError(
          (error) =>
            new ClientSdkContractFailure({
              label: "execution sse event",
              message: error.message,
              body: parsed
            })
        )
      );
      onEvent(decoded);
    }

    return remainder;
  });
}

export async function consumeSseStream(
  response: Response,
  onEvent: (event: ExecutionSseEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  if (!response.body) {
    throw new ClientSdkTransportError({
      stage: "body",
      message: "SSE response has no body"
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) {
        throw new ClientSdkTransportError({
          stage: "aborted",
          message: "Observation was aborted"
        });
      }

      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = await Effect.runPromise(parseSseChunk(buffer, onEvent));
    }

    if (buffer.trim().length > 0) {
      await Effect.runPromise(parseSseChunk(`${buffer}\n\n`, onEvent));
    }
  } finally {
    reader.releaseLock();
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
