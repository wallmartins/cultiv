import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { decodeApiErrorResponse, decodeQueuedExecutionView, decodeSyncExecutionView } from "@my-ai-orchestrator/contracts";
import { createBackendTestAuthorizationHeader } from "../../apps/backend/src/auth/index.js";
import {
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices,
  expectedVoiceProfileSnapshotId,
  seedExecutionVoiceState,
  waitForJobStatus
} from "./backend-app.fixtures.js";

describe("backend app execution surface", () => {
  it("executes the main pipeline flow through the Effect service and preserves idempotency", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_1", billingPlanId: "pro" });
    const services = createBackendAppTestServices(config);
    seedExecutionVoiceState(services);
    const app = createBackendAppTestApp(config, services);

    const payload = {
      contentType: "validation-post",
      briefing: {
        topic: "Monorepo migration",
        keyPoints: ["packages first", "backend second", "typed contracts"]
      },
      includeTrace: true,
      idempotencyKey: "idem-run-1"
    };

    const firstResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(firstResponse.status).toBe(200);

    const firstBody = await firstResponse.json();
    const decodedFirst = await Effect.runPromise(decodeSyncExecutionView(firstBody));
    expect(decodedFirst.mode).toBe("sync");
    expect(decodedFirst.contentType).toBe("validation-post");
    expect(decodedFirst.pipelineName).toBe("validation-post");
    expect(decodedFirst.content).toContain("provider:gemini:");
    expect(decodedFirst.trace).toBeDefined();
    expect(decodedFirst.voice?.voiceProfileSnapshotId).toBe(
      expectedVoiceProfileSnapshotId("user_1", 2, "validation-post")
    );

    const secondResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(secondResponse.status).toBe(200);

    const secondBody = await secondResponse.json();
    const decodedSecond = await Effect.runPromise(decodeSyncExecutionView(secondBody));
    expect(decodedSecond).toEqual(decodedFirst);
  });

  it("returns a queued job when the backend strategy is async", async () => {
    const config = createBackendAppTestConfig({
      billingUserId: "user_1",
      billingPlanId: "pro",
      executionMode: "async"
    });
    const services = createBackendAppTestServices(config);
    seedExecutionVoiceState(services);
    const app = createBackendAppTestApp(config, services);

    const response = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contentType: "newsletter",
        briefing: {
          topic: "Architecture async"
        }
      })
    });

    expect(response.status).toBe(202);

    const body = await response.json();
    const decoded = await Effect.runPromise(decodeQueuedExecutionView(body));
    expect(decoded.status).toBe("queued");
    expect(decoded.contentType).toBe("newsletter");
    expect(decoded.jobId).toMatch(/^[0-9a-f-]{36}$/);

    const completed = await waitForJobStatus(app, decoded.jobId, "done");
    expect(completed.status).toBe("done");
    expect(completed.result?.content).toContain("provider:gemini:");
  });

  it("maps missing jobs to typed 404 responses", async () => {
    const config = createBackendAppTestConfig();
    const app = createBackendAppTestApp(config, createBackendAppTestServices(config));

    const response = await app.request("/me/executions/does-not-exist", {
      headers: {
        authorization: createBackendTestAuthorizationHeader({ userId: "user_1" })
      }
    });
    expect(response.status).toBe(404);

    const body = await response.json();
    const decoded = await Effect.runPromise(decodeApiErrorResponse(body));

    expect(decoded.code).toBe("resource_not_found");
    expect(decoded.category).toBe("not_found");
    expect(decoded.message).toContain("does-not-exist");
  });
});
