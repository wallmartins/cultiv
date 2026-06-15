import { Effect } from "effect";
import type {
  ExecutionStatusView,
  ExecutionTransition,
  ObservationFailure
} from "@my-ai-orchestrator/contracts";
import type { ClientSdkConfig } from "./config.js";
import { resolveClientSdkConfig } from "./config.js";
import { mapStatusSnapshotToTransitions } from "./execution-transitions.js";
import { observeViaSseEffect } from "./observe-via-sse.js";
import { pollExecutionStatusEffect } from "./poll-execution-status.js";
import type { HttpTransport } from "./transport.js";
import { isTimedOut, sleepEffect } from "./watch-utils.js";

export interface ObservationHandle {
  readonly stop: () => void;
}

export interface ExecutionWatchInput {
  readonly executionId: string;
  readonly onTransition: (transition: ExecutionTransition) => void;
  readonly onObservationFailure?: (failure: ObservationFailure) => void;
  readonly signal?: AbortSignal;
}

export function startExecutionWatch(
  config: ClientSdkConfig,
  transport: HttpTransport,
  input: ExecutionWatchInput
): ObservationHandle {
  const resolved = resolveClientSdkConfig(config);
  const watchController = new AbortController();
  const linkedSignal = input.signal;
  if (linkedSignal) {
    if (linkedSignal.aborted) {
      watchController.abort();
    } else {
      linkedSignal.addEventListener("abort", () => watchController.abort(), { once: true });
    }
  }

  const startedAt = Date.now();
  let stopped = false;

  const watchProgram = Effect.gen(function* () {
    for (let attempt = 0; attempt <= resolved.watchResilience.maxSseReconnectAttempts; attempt += 1) {
      if (stopped || watchController.signal.aborted) {
        return;
      }

      if (isTimedOut(startedAt, resolved.watchResilience.totalObservationTimeoutMs)) {
        reportFailure(input, { reason: "timeout", message: "Execution observation timed out" });
        return;
      }

      const terminal = yield* Effect.either(
        observeViaSseEffect(transport, input.executionId, input.onTransition, watchController.signal)
      );

      if (terminal._tag === "Right" && terminal.right) {
        return;
      }

      if (stopped || watchController.signal.aborted) {
        return;
      }

      if (attempt < resolved.watchResilience.maxSseReconnectAttempts) {
        yield* sleepEffect(
          resolved.watchResilience.sseBackoffBaseMs * 2 ** attempt,
          watchController.signal
        );
      }
    }

    let pollingFailures = 0;
    let lastSnapshot: ExecutionStatusView | undefined;

    while (!stopped && !watchController.signal.aborted) {
      if (isTimedOut(startedAt, resolved.watchResilience.totalObservationTimeoutMs)) {
        reportFailure(input, { reason: "timeout", message: "Execution observation timed out" });
        return;
      }

      const pollResult = yield* Effect.either(
        pollExecutionStatusEffect(transport, input.executionId, watchController.signal)
      );

      if (stopped || watchController.signal.aborted) {
        return;
      }

      if (pollResult._tag === "Left") {
        pollingFailures += 1;
        if (pollingFailures >= resolved.watchResilience.maxPollingFailures) {
          reportFailure(input, {
            reason: "poll_fallback_exhausted",
            message: pollResult.left._tag
          });
          return;
        }

        yield* sleepEffect(resolved.watchResilience.pollingIntervalMs, watchController.signal);
        continue;
      }

      pollingFailures = 0;
      const occurredAt = pollResult.right.completedAt ?? new Date().toISOString();
      const transitions = mapStatusSnapshotToTransitions(
        input.executionId,
        lastSnapshot,
        pollResult.right,
        occurredAt
      );
      lastSnapshot = pollResult.right;

      for (const transition of transitions) {
        input.onTransition(transition);
      }

      if (pollResult.right.status === "done" || pollResult.right.status === "failed") {
        return;
      }

      yield* sleepEffect(resolved.watchResilience.pollingIntervalMs, watchController.signal);
    }
  });

  void Effect.runPromise(watchProgram).catch(() => {
    if (!stopped && !watchController.signal.aborted) {
      reportFailure(input, {
        reason: "reconnect_exhausted",
        message: "Execution observation failed after SSE reconnect attempts"
      });
    }
  });

  return {
    stop: () => {
      stopped = true;
      watchController.abort();
    }
  };
}

function reportFailure(input: ExecutionWatchInput, failure: ObservationFailure): void {
  input.onObservationFailure?.(failure);
}
