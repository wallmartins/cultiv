import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  decodeApiErrorResponse,
  decodeExecutionsPageView,
  decodeExecutionStatusView,
  decodeQueuedExecutionView,
  decodeSyncExecutionView
} from "@my-ai-orchestrator/contracts";
import { createExecutionApp } from "./backend-app-executions.shared.js";

describe("backend app execution surface", () => {
  it("exposes execution routes through the canonical /me surface", async () => {
    const { app: syncApp } = createExecutionApp("sync");

    const syncResponse = await syncApp.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contentType: "linkedin-post",
        briefing: {
          topic: "Monorepo migration",
          audience: "engineering leaders"
        },
        includeTrace: true
      })
    });

    expect(syncResponse.status).toBe(200);
    const decodedSync = await Effect.runPromise(decodeSyncExecutionView(await syncResponse.json()));
    expect(decodedSync.voice.voiceProfileSnapshotId).toBe(
      "voice-profile-snapshot:user_1:v2:linkedin-post:2026-05-11T00:00:00.000Z"
    );

    const { app: asyncApp } = createExecutionApp("async");
    const asyncResponse = await asyncApp.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contentType: "newsletter",
        briefing: {
          topic: "Observability",
          audience: "platform teams"
        }
      })
    });

    expect(asyncResponse.status).toBe(202);
    const decodedQueued = await Effect.runPromise(decodeQueuedExecutionView(await asyncResponse.json()));
    expect(decodedQueued.voice.voiceProfileSnapshotId).toBe(
      "voice-profile-snapshot:user_1:v2:newsletter:2026-05-11T00:00:00.000Z"
    );

    const listResponse = await asyncApp.request("/me/executions?limit=10&offset=0");
    expect(listResponse.status).toBe(200);
    const decodedList = await Effect.runPromise(decodeExecutionsPageView(await listResponse.json()));
    expect(decodedList.total).toBeGreaterThanOrEqual(1);
    expect(decodedList.items[0]?.voice?.voiceProfileSnapshotId).toBe(
      "voice-profile-snapshot:user_1:v2:newsletter:2026-05-11T00:00:00.000Z"
    );

    const executionId = decodedQueued.jobId;
    const statusResponse = await asyncApp.request(`/me/executions/${executionId}`);
    expect(statusResponse.status).toBe(200);
    const decodedStatus = await Effect.runPromise(decodeExecutionStatusView(await statusResponse.json()));
    expect(decodedStatus.voice?.voiceProfileSnapshotId).toBe(
      "voice-profile-snapshot:user_1:v2:newsletter:2026-05-11T00:00:00.000Z"
    );

    const eventsResponse = await asyncApp.request(`/me/executions/${executionId}/events`);
    expect(eventsResponse.status).toBe(200);
    expect(eventsResponse.headers.get("content-type")).toContain("text/event-stream");
  });

  it("rejects an unknown contentType before reaching the execution runtime", async () => {
    const { app } = createExecutionApp("sync");

    const response = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contentType: "unknown-content-type",
        briefing: {
          topic: "Policy drift"
        }
      })
    });

    expect(response.status).toBe(400);
    const error = await Effect.runPromise(decodeApiErrorResponse(await response.json()));
    expect(error.code).toBe("invalid_request");
    expect(error.category).toBe("invalid_request");
    expect(error.message).toContain("unknown-content-type");
  });
});
