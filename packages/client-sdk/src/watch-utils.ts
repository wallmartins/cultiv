import { Effect } from "effect";
import { ClientSdkTransportError } from "./errors.js";

export function isTimedOut(startedAt: number, timeoutMs: number): boolean {
  return Date.now() - startedAt >= timeoutMs;
}

export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("aborted"));
      return;
    }

    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    };

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function sleepEffect(ms: number, signal: AbortSignal): Effect.Effect<void, ClientSdkTransportError> {
  return Effect.tryPromise({
    try: () => sleep(ms, signal),
    catch: () =>
      new ClientSdkTransportError({
        stage: "aborted",
        message: "Request was aborted"
      })
  });
}
