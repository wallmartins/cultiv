import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type {
  ExecutionStatusView,
  ExecutionTransition,
  ObservationFailure
} from "@my-ai-orchestrator/contracts";
import type { ClientSdkConfig } from "../../packages/client-sdk/src/config.js";
import { startExecutionWatch } from "../../packages/client-sdk/src/execution-watch.js";
import type { HttpRequest, HttpTransport } from "../../packages/client-sdk/src/transport.js";
import type { HttpResponse } from "../../packages/client-sdk/src/decode-response.js";
import { ClientSdkTransportError } from "../../packages/client-sdk/src/errors.js";
import { createDoneExecutionStatus, waitUntil } from "./watch-fixtures.js";

const FAST_RESILIENCE: NonNullable<ClientSdkConfig["watchResilience"]> = {
  maxSseReconnectAttempts: 2,
  sseBackoffBaseMs: 10,
  pollingIntervalMs: 10,
  maxPollingFailures: 3,
  totalObservationTimeoutMs: 60_000
};

function createRunningStatus(executionId: string): ExecutionStatusView {
  return {
    jobId: executionId,
    status: "running",
    contentType: "validation-post",
    progress: {
      currentStep: "draft",
      stepIndex: 1,
      totalSteps: 3,
      percent: 33
    },
    result: null,
    error: null,
    createdAt: "2026-05-09T00:00:00.000Z",
    completedAt: null
  };
}

function jsonResponse(status: number, body: unknown): HttpResponse {
  return {
    status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}

function createSseResponse(payload: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(payload));
      controller.close();
    }
  });

  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/event-stream" }
  });
}

function createWatchHarness(options: {
  readonly onSse?: () => Effect.Effect<Response, ClientSdkTransportError>;
  readonly onPoll?: (request: HttpRequest) => Effect.Effect<HttpResponse, ClientSdkTransportError>;
  readonly watchResilience?: ClientSdkConfig["watchResilience"];
  readonly signal?: AbortSignal;
}) {
  const sseCalls: number[] = [];
  const pollCalls: HttpRequest[] = [];
  const transitions: ExecutionTransition[] = [];
  const failures: ObservationFailure[] = [];

  const transport: HttpTransport = {
    openSse() {
      sseCalls.push(Date.now());
      return (
        options.onSse?.() ??
        Effect.succeed(new Response(null, { status: 503, statusText: "SSE unavailable" }))
      );
    },
    send(request) {
      pollCalls.push(request);
      return (
        options.onPoll?.(request) ??
        Effect.succeed(jsonResponse(404, { status: 404, code: "resource_not_found", message: "missing" }))
      );
    }
  };

  const handle = startExecutionWatch(
    {
      baseUrl: "https://api.example.com",
      watchResilience: options.watchResilience ?? FAST_RESILIENCE
    },
    transport,
    {
      executionId: "exec_resilience",
      signal: options.signal,
      onTransition: (transition) => {
        transitions.push(transition);
      },
      onObservationFailure: (failure) => {
        failures.push(failure);
      }
    }
  );

  return {
    handle,
    sseCalls,
    pollCalls,
    transitions,
    failures
  };
}

async function waitFor(predicate: () => boolean, timeoutMs = 5_000): Promise<void> {
  return waitUntil(predicate, timeoutMs);
}

describe("execution-watch resilience", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries SSE up to maxSseReconnectAttempts before falling back to polling", async () => {
    const harness = createWatchHarness({
      onSse: () => Effect.succeed(new Response(null, { status: 503 })),
      onPoll: () => Effect.succeed(jsonResponse(200, createDoneExecutionStatus("exec_resilience")))
    });

    await vi.advanceTimersByTimeAsync(500);
    harness.handle.stop();

    expect(harness.sseCalls.length).toBe(3);
    expect(harness.pollCalls.length).toBeGreaterThanOrEqual(1);
    expect(harness.transitions.some((transition) => transition.type === "completed")).toBe(true);
    expect(harness.failures).toHaveLength(0);
  });

  it("completes over SSE without polling when the stream reaches a terminal event", async () => {
    const harness = createWatchHarness({
      onSse: () =>
        Effect.succeed(
          createSseResponse(
            'event: done\ndata: {"type":"done","payload":{"content":"hello","metadata":{}},"occurredAt":"2026-05-09T00:00:05.000Z"}\n\n'
          )
        )
    });

    await waitFor(() => harness.transitions.some((transition) => transition.type === "completed"));
    harness.handle.stop();

    expect(harness.sseCalls.length).toBe(1);
    expect(harness.pollCalls).toHaveLength(0);
    expect(harness.failures).toHaveLength(0);
  });

  it("reports poll_fallback_exhausted after consecutive polling failures", async () => {
    const harness = createWatchHarness({
      watchResilience: {
        ...FAST_RESILIENCE,
        maxSseReconnectAttempts: 0
      },
      onPoll: () => Effect.succeed(jsonResponse(404, { message: "missing" }))
    });

    await waitFor(() => harness.failures.some((failure) => failure.reason === "poll_fallback_exhausted"));
    harness.handle.stop();

    expect(harness.sseCalls.length).toBe(1);
    expect(harness.pollCalls.length).toBe(3);
    expect(harness.failures[0]).toMatchObject({
      reason: "poll_fallback_exhausted",
      message: "ClientSdkHttpStatusError"
    });
  });

  it("resets the polling failure counter after a successful poll", async () => {
    let pollAttempt = 0;
    const harness = createWatchHarness({
      watchResilience: {
        ...FAST_RESILIENCE,
        maxSseReconnectAttempts: 0,
        maxPollingFailures: 3
      },
      onPoll: () => {
        pollAttempt += 1;

        if (pollAttempt === 1 || pollAttempt === 2) {
          return Effect.succeed(jsonResponse(503, { message: "temporary" }));
        }

        if (pollAttempt === 3) {
          return Effect.succeed(jsonResponse(200, createRunningStatus("exec_resilience")));
        }

        return Effect.succeed(jsonResponse(404, { message: "missing" }));
      }
    });

    await vi.advanceTimersByTimeAsync(500);
    harness.handle.stop();

    expect(harness.pollCalls.length).toBeGreaterThanOrEqual(6);
    expect(harness.failures.some((failure) => failure.reason === "poll_fallback_exhausted")).toBe(true);
    expect(harness.transitions.some((transition) => transition.type === "progressed")).toBe(true);
  });

  it("reports timeout when total observation budget is exceeded during polling", async () => {
    const harness = createWatchHarness({
      watchResilience: {
        maxSseReconnectAttempts: 0,
        sseBackoffBaseMs: 1,
        pollingIntervalMs: 20,
        maxPollingFailures: 100,
        totalObservationTimeoutMs: 50
      },
      onPoll: () => Effect.succeed(jsonResponse(200, createRunningStatus("exec_resilience")))
    });

    await waitFor(() => harness.failures.some((failure) => failure.reason === "timeout"));
    harness.handle.stop();

    expect(harness.failures[0]).toMatchObject({
      reason: "timeout",
      message: "Execution observation timed out"
    });
  });

  it("does not report observation failure when stop() is called before timeout", async () => {
    const harness = createWatchHarness({
      watchResilience: {
        maxSseReconnectAttempts: 0,
        sseBackoffBaseMs: 1,
        pollingIntervalMs: 50,
        maxPollingFailures: 100,
        totalObservationTimeoutMs: 5
      },
      onPoll: () => Effect.succeed(jsonResponse(200, createRunningStatus("exec_resilience")))
    });

    harness.handle.stop();
    await vi.advanceTimersByTimeAsync(200);

    expect(harness.failures).toHaveLength(0);
  });

  it("recovers through polling after malformed SSE payloads exhaust reconnect attempts", async () => {
    const harness = createWatchHarness({
      watchResilience: {
        ...FAST_RESILIENCE,
        maxSseReconnectAttempts: 1
      },
      onSse: () =>
        Effect.succeed(
          createSseResponse('event: progress\ndata: not-valid-json\n\n')
        ),
      onPoll: () => Effect.succeed(jsonResponse(200, createDoneExecutionStatus("exec_resilience")))
    });

    await waitFor(() => harness.transitions.some((transition) => transition.type === "completed"));
    harness.handle.stop();

    expect(harness.sseCalls.length).toBeGreaterThanOrEqual(2);
    expect(harness.pollCalls.length).toBeGreaterThanOrEqual(1);
    expect(harness.failures).toHaveLength(0);
  });

  it("stops quietly when the caller abort signal is triggered", async () => {
    const controller = new AbortController();
    const harness = createWatchHarness({
      signal: controller.signal,
      watchResilience: {
        maxSseReconnectAttempts: 0,
        sseBackoffBaseMs: 1,
        pollingIntervalMs: 50,
        maxPollingFailures: 100,
        totalObservationTimeoutMs: 60_000
      },
      onSse: () => Effect.succeed(new Response(null, { status: 503 })),
      onPoll: () => Effect.succeed(jsonResponse(200, createRunningStatus("exec_resilience")))
    });

    await vi.advanceTimersByTimeAsync(30);
    controller.abort();
    await vi.advanceTimersByTimeAsync(500);
    harness.handle.stop();

    expect(harness.failures).toHaveLength(0);
    expect(harness.pollCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("emits a failed transition when SSE streams an error terminal event", async () => {
    const harness = createWatchHarness({
      onSse: () =>
        Effect.succeed(
          createSseResponse(
            'event: error\ndata: {"type":"error","payload":{"message":"Provider timeout","step":"draft"},"occurredAt":"2026-05-09T00:00:05.000Z"}\n\n'
          )
        )
    });

    await waitFor(() => harness.transitions.some((transition) => transition.type === "failed"));
    harness.handle.stop();

    expect(harness.sseCalls.length).toBe(1);
    expect(harness.pollCalls).toHaveLength(0);
    expect(harness.failures).toHaveLength(0);
    expect(harness.transitions).toEqual([
      expect.objectContaining({
        type: "failed",
        executionId: "exec_resilience",
        error: { message: "Provider timeout", step: "draft" },
        occurredAt: "2026-05-09T00:00:05.000Z"
      })
    ]);
  });
});
