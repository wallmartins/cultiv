import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  decodeApiErrorResponse,
  decodeHealthCheckResponse,
  decodeExecutionStatusView,
  decodeQueuedExecutionView,
  decodeReadinessResponse
} from "@my-ai-orchestrator/contracts";
import {
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices,
  seedBillingSubscription,
  seedExecutionVoiceState,
  backendAppTestNow
} from "./backend-app.fixtures.js";
import { createBackendTestAuthorizationHeader } from "../../apps/backend/src/auth/index.js";

describe("backend app health and pipeline contracts", () => {
  it("exposes health and readiness on root and api prefixes", async () => {
    const config = createBackendAppTestConfig();
    const app = createBackendAppTestApp(config, createBackendAppTestServices(config));

    const rootResponse = await app.request("/health");
    const apiResponse = await app.request("/api/health");
    const readyRootResponse = await app.request("/ready");
    const readyApiResponse = await app.request("/api/ready");

    expect(rootResponse.status).toBe(200);
    expect(apiResponse.status).toBe(200);
    expect(readyRootResponse.status).toBe(200);
    expect(readyApiResponse.status).toBe(200);

    const rootBody = await rootResponse.json();
    const apiBody = await apiResponse.json();
    const readyRootBody = await readyRootResponse.json();
    const readyApiBody = await readyApiResponse.json();

    const decodedRoot = await Effect.runPromise(decodeHealthCheckResponse(rootBody));
    const decodedApi = await Effect.runPromise(decodeHealthCheckResponse(apiBody));
    const decodedReadyRoot = await Effect.runPromise(decodeReadinessResponse(readyRootBody));
    const decodedReadyApi = await Effect.runPromise(decodeReadinessResponse(readyApiBody));

    expect(decodedRoot).toEqual({
      status: "ok",
      time: backendAppTestNow.toISOString(),
      engine: {
        status: "ready",
        version: "0.1.0",
        uptimeSec: 5
      }
    });
    expect(decodedApi).toEqual(decodedRoot);
    expect(decodedReadyRoot).toEqual({
      status: "ready",
      time: backendAppTestNow.toISOString(),
      service: {
        environment: "test",
        version: "0.1.0"
      },
      checks: {
        config: { status: "ready" },
        auth: { status: "ready" },
        database: { status: "ready" }
      }
    });
    expect(decodedReadyApi).toEqual(decodedReadyRoot);
  });

  it("validates requests and returns queued executions through shared contracts", async () => {
    const config = createBackendAppTestConfig({ executionMode: "async", billingUserId: "health-user" });
    const services = createBackendAppTestServices(config);
    seedBillingSubscription(services, "health-user");
    seedExecutionVoiceState(services, "health-user");
    const app = createBackendAppTestApp(config, services);

    const invalidResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: createBackendTestAuthorizationHeader({ userId: "health-user" })
      },
      body: JSON.stringify({
        briefing: "missing content type"
      })
    });

    expect(invalidResponse.status).toBe(400);

    const invalidBody = await invalidResponse.json();
    const decodedInvalid = await Effect.runPromise(decodeApiErrorResponse(invalidBody));
    expect(decodedInvalid.code).toBe("invalid_request");
    expect(decodedInvalid.category).toBe("invalid_request");

    const createdResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: createBackendTestAuthorizationHeader({ userId: "health-user" })
      },
      body: JSON.stringify({
        rhetoricalMode: "expound",
        scope: { lengthTier: "short" },
        briefing: {
          topic: "Shared contract validation"
        },
        idempotencyKey: "backend-app-health-created-job"
      })
    });

    expect(createdResponse.status).toBe(202);

    const createdBody = await createdResponse.json();
    const decodedCreated = await Effect.runPromise(decodeQueuedExecutionView(createdBody));
    expect(decodedCreated.jobId).toMatch(/^[0-9a-f-]{36}$/);
    expect(decodedCreated.contentType).toBe("short-piece");
    expect(decodedCreated.estimatedSteps).toBeGreaterThan(0);

    const statusResponse = await app.request(`/me/executions/${decodedCreated.jobId}`, {
      headers: {
        authorization: createBackendTestAuthorizationHeader({ userId: "health-user" })
      }
    });
    expect(statusResponse.status).toBe(200);

    const statusBody = await statusResponse.json();
    const decodedStatus = await Effect.runPromise(decodeExecutionStatusView(statusBody));
    expect(decodedStatus).toMatchObject({
      jobId: decodedCreated.jobId,
      contentType: "short-piece"
    });
    expect(["queued", "running", "done"]).toContain(decodedStatus.status);
  });
});
