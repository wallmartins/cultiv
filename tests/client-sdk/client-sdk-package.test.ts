import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  ClientSdkHttpStatusError,
  ClientSdkService,
  ClientSdkTransportError,
  createClientSdk,
  createClientSdkLayer,
  isClientSdkError,
  withClientSdk
} from "../../packages/client-sdk/src/index.js";
import { mapSseEventToTransition } from "../../packages/client-sdk/src/execution-transitions.js";
import { parseSseChunk } from "../../packages/client-sdk/src/sse-parser.js";
import {
  createDoneExecutionStatus,
  createSseDoneStream,
  voiceMetadata,
  waitUntil
} from "./watch-fixtures.js";

type FetchCall = {
  readonly url: string;
  readonly init?: RequestInit;
};

describe("client-sdk package", () => {
  it("exposes product capability subclients", () => {
    const sdk = createClientSdk({
      baseUrl: "https://api.example.com",
      fetcher: async () => new Response("{}", { status: 200 })
    });

    expect(typeof sdk.preview.get).toBe("function");
    expect(typeof sdk.executions.create).toBe("function");
    expect(typeof sdk.executions.watch).toBe("function");
    expect(typeof sdk.voice.getProfile).toBe("function");
    expect(typeof sdk.onboarding.getStatus).toBe("function");
    expect(typeof sdk.generationIntents.list).toBe("function");
    expect(typeof sdk.toPromise).toBe("function");
  });

  it("rejects toPromise with typed ClientSdkHttpStatusError", async () => {
    const sdk = createClientSdk({
      baseUrl: "https://api.example.com",
      fetcher: async () =>
        new Response(
          JSON.stringify({
            status: 404,
            code: "resource_not_found",
            category: "not_found",
            message: "Voice profile not found",
            retryable: false
          }),
          { status: 404, headers: { "content-type": "application/json" } }
        )
    });

    await expect(sdk.toPromise(sdk.voice.getProfile())).rejects.toBeInstanceOf(ClientSdkHttpStatusError);
    await expect(sdk.toPromise(sdk.voice.getProfile())).rejects.toMatchObject({
      _tag: "ClientSdkHttpStatusError",
      status: 404,
      code: "resource_not_found"
    });
  });

  it("fails when getToken is configured but returns no token", async () => {
    const sdk = createClientSdk({
      baseUrl: "https://api.example.com",
      getToken: () => undefined,
      fetcher: async () => new Response("{}", { status: 200 })
    });

    const result = await Effect.runPromise(Effect.either(sdk.voice.getProfile()));

    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(ClientSdkTransportError);
    expect(result.left).toMatchObject({
      stage: "token",
      message: "Access token is required but missing"
    });
  });

  it("injects bearer tokens and custom headers into requests", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          completed: false
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      );
    };

    const sdk = createClientSdk({
      baseUrl: "https://api.example.com",
      getToken: () => "token_123",
      headers: { "x-client": "test" },
      fetcher
    });

    await sdk.toPromise(sdk.onboarding.getStatus());

    expect(calls[0]?.url).toBe("https://api.example.com/me/onboarding/status");
    expect(calls[0]?.init?.headers).toMatchObject({
      accept: "application/json",
      authorization: "Bearer token_123",
      "x-client": "test"
    });
  });

  it("auto-generates idempotency keys for mutating execution requests", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          jobId: "exec_1",
          status: "queued",
          contentType: "validation-post",
          estimatedSteps: 3,
          createdAt: "2026-05-09T00:00:00.000Z",
          voice: voiceMetadata
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      );
    };

    const sdk = createClientSdk({ baseUrl: "https://api.example.com", fetcher });

    await sdk.toPromise(
      sdk.executions.create({
        contentType: "validation-post",
        briefing: "Write a validation post"
      })
    );

    const body = JSON.parse(String(calls[0]?.init?.body));
    expect(calls[0]?.url).toBe("https://api.example.com/me/executions/run");
    expect(body.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(body.briefing).toBe("Write a validation post");
  });

  it("classifies public API errors through the shared error envelope", async () => {
    const sdk = createClientSdk({
      baseUrl: "https://api.example.com",
      fetcher: async () =>
        new Response(
          JSON.stringify({
            status: 401,
            code: "authentication_expired_token",
            category: "authentication",
            message: "Bearer token expired",
            retryable: false,
            details: { reason: "expired_token" }
          }),
          { status: 401, headers: { "content-type": "application/json" } }
        )
    });

    const result = await Effect.runPromise(
      Effect.either(
        sdk.preview.get({
          contentType: "validation-post"
        })
      )
    );

    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(ClientSdkHttpStatusError);
    expect(result.left).toMatchObject({
      _tag: "ClientSdkHttpStatusError",
      status: 401,
      code: "authentication_expired_token",
      category: "authentication",
      retryable: false
    });
  });

  it("aborts in-flight requests when signal is triggered", async () => {
    const controller = new AbortController();
    controller.abort();

    const sdk = createClientSdk({
      baseUrl: "https://api.example.com",
      fetcher: async () => new Response("{}", { status: 200 })
    });

    const result = await Effect.runPromise(
      Effect.either(sdk.onboarding.getStatus({ signal: controller.signal }))
    );

    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(ClientSdkTransportError);
    expect(result.left).toMatchObject({ stage: "aborted" });
  });

  it("maps sse events to typed execution transitions", () => {
    const started = mapSseEventToTransition("exec_1", {
      type: "progress",
      occurredAt: "2026-05-09T00:00:00.000Z",
      payload: {
        currentStep: "queued",
        stepIndex: 0,
        totalSteps: 3,
        percent: 0
      }
    });
    expect(started).toMatchObject({ type: "started", executionId: "exec_1" });

    const progressed = mapSseEventToTransition("exec_1", {
      type: "progress",
      occurredAt: "2026-05-09T00:00:01.000Z",
      payload: {
        currentStep: "draft",
        stepIndex: 1,
        totalSteps: 3,
        percent: 33
      }
    });
    expect(progressed).toMatchObject({ type: "progressed", executionId: "exec_1" });
  });

  it("parses sse chunks into execution events", async () => {
    const events: string[] = [];
    await Effect.runPromise(
      parseSseChunk(
        'event: progress\ndata: {"type":"progress","payload":{"currentStep":"draft","stepIndex":1,"totalSteps":3,"percent":33},"occurredAt":"2026-05-09T00:00:01.000Z"}\n\n',
        (event) => {
          events.push(event.type);
        }
      )
    );
    expect(events).toEqual(["progress"]);
  });

  describe("executions.watch transport integration", () => {
    // Resilience state machine (reconnect, polling exhaustion, timeout) lives in
    // execution-watch-resilience.test.ts. These tests assert fetcher wiring only.

    it("opens the SSE events URL with bearer auth and accept header", async () => {
      const calls: FetchCall[] = [];
      const fetcher = async (url: string, init?: RequestInit) => {
        calls.push({ url, init });

        if (url.includes("/events")) {
          return new Response(createSseDoneStream(), {
            status: 200,
            headers: { "content-type": "text/event-stream" }
          });
        }

        return new Response("{}", { status: 404 });
      };

      const transitions: string[] = [];
      const sdk = createClientSdk({
        baseUrl: "https://api.example.com",
        getToken: () => "watch_token",
        fetcher
      });

      const handle = sdk.executions.watch({
        executionId: "exec/watch+1",
        onTransition: (transition) => {
          transitions.push(transition.type);
        }
      });

      await waitUntil(() => transitions.includes("completed"));
      handle.stop();

      const sseCall = calls.find((call) => call.url.includes("/events"));
      expect(sseCall?.url).toBe("https://api.example.com/me/executions/exec%2Fwatch%2B1/events");
      expect(sseCall?.init?.headers).toMatchObject({
        accept: "text/event-stream",
        authorization: "Bearer watch_token"
      });
      expect(calls.some((call) => call.url.includes("/me/executions/") && !call.url.includes("/events"))).toBe(
        false
      );
    });

    it("forwards shared client headers to SSE and polling fallback requests", async () => {
      const calls: FetchCall[] = [];
      const fetcher = async (url: string, init?: RequestInit) => {
        calls.push({ url, init });

        if (url.includes("/events")) {
          return new Response(null, { status: 503 });
        }

        return new Response(JSON.stringify(createDoneExecutionStatus("exec_2")), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      };

      const transitions: string[] = [];
      const sdk = createClientSdk({
        baseUrl: "https://api.example.com",
        headers: { "x-client": "cultiv-web" },
        fetcher,
        watchResilience: {
          maxSseReconnectAttempts: 0,
          sseBackoffBaseMs: 1,
          pollingIntervalMs: 10,
          maxPollingFailures: 3,
          totalObservationTimeoutMs: 60_000
        }
      });

      const handle = sdk.executions.watch({
        executionId: "exec_2",
        onTransition: (transition) => {
          transitions.push(transition.type);
        }
      });

      await waitUntil(() => transitions.includes("completed"));
      handle.stop();

      expect(calls.length).toBeGreaterThanOrEqual(2);
      for (const call of calls) {
        expect(call.init?.headers).toMatchObject({ "x-client": "cultiv-web" });
      }

      const pollCall = calls.find((call) => call.url.endsWith("/me/executions/exec_2"));
      expect(pollCall?.init?.headers).toMatchObject({
        accept: "application/json",
        "x-client": "cultiv-web"
      });
    });

    it("returns an observation handle that stops further fetch activity", async () => {
      const calls: FetchCall[] = [];
      const fetcher = async (url: string, init?: RequestInit) => {
        calls.push({ url, init });

        if (url.includes("/events")) {
          return new Response(null, { status: 503 });
        }

        return new Response(JSON.stringify(createDoneExecutionStatus("exec_3")), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      };

      const sdk = createClientSdk({
        baseUrl: "https://api.example.com",
        fetcher,
        watchResilience: {
          maxSseReconnectAttempts: 0,
          sseBackoffBaseMs: 1,
          pollingIntervalMs: 50,
          maxPollingFailures: 100,
          totalObservationTimeoutMs: 60_000
        }
      });

      const handle = sdk.executions.watch({
        executionId: "exec_3",
        onTransition: () => {}
      });

      await waitUntil(() => calls.some((call) => call.url.endsWith("/me/executions/exec_3")));
      const callsBeforeStop = calls.length;
      handle.stop();
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(calls.length).toBe(callsBeforeStop);
    });
  });

  it("provides the sdk through Effect layers", () => {
    const result = Effect.runSync(
      Effect.gen(function* () {
        const sdk = yield* ClientSdkService;
        return sdk;
      }).pipe(
        Effect.provide(
          createClientSdkLayer({
            baseUrl: "https://api.example.com",
            fetcher: async () => new Response("{}", { status: 200 })
          })
        )
      )
    );

    expect(typeof result.preview.get).toBe("function");
  });

  it("supports withClientSdk helper", () => {
    const result = Effect.runSync(
      withClientSdk(
        Effect.gen(function* () {
          const sdk = yield* ClientSdkService;
          return sdk.transport;
        }),
        {
          baseUrl: "https://api.example.com",
          fetcher: async () => new Response("{}", { status: 200 })
        }
      )
    );

    expect(typeof result.send).toBe("function");
  });

  it("identifies client sdk errors with isClientSdkError", () => {
    const error = new ClientSdkHttpStatusError({
      label: "test",
      status: 500,
      retryable: true
    });

    expect(isClientSdkError(error)).toBe(true);
    expect(isClientSdkError(error, "ClientSdkHttpStatusError")).toBe(true);
    expect(isClientSdkError(error, "ClientSdkTransportError")).toBe(false);
    expect(isClientSdkError(new Error("nope"))).toBe(false);
  });
});
