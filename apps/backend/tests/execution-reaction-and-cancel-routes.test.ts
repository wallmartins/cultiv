import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { createDatabase } from "@my-ai-orchestrator/database";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import { createBackendTestAccessToken } from "../src/auth/test-auth.js";
import { createTestConfig, createMinimalServices, createTestApp } from "./test-helpers.js";

function ownedJob(userId: string, status: "queued" | "running" | "done" | "failed" | "cancelled" = "queued") {
  return {
    jobId: "job-1",
    status,
    contentType: "twitter-thread",
    progress: null,
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    completedAt: status === "done" ? new Date().toISOString() : null,
    userId
  };
}

describe("#2 reaction routes", () => {
  it("POST /me/executions/:id/reaction returns 403 when execution belongs to another user", async () => {
    const config = createTestConfig();
    const services = createMinimalServices();
    const app = createTestApp(config, services, {
      getJobStatus: () => Effect.succeed(ownedJob("other-user-id"))
    });
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });

    const response = await app.request("/me/executions/job-1/reaction", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reaction: "up" })
    });

    expect(response.status).toBe(403);
  });

  it("DELETE /me/executions/:id/reaction returns 403 when execution belongs to another user", async () => {
    const config = createTestConfig();
    const services = createMinimalServices();
    const app = createTestApp(config, services, {
      getJobStatus: () => Effect.succeed(ownedJob("other-user-id"))
    });
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });

    const response = await app.request("/me/executions/job-1/reaction", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(403);
  });

  it("upserts a mutable reaction (up<->down), hydrates it on GET, and retracts on DELETE", async () => {
    const config = createTestConfig();
    const users = createBackendApplicationUserMemoryRepository();
    Effect.runSync(users.create({ id: "user-1", externalSubject: "auth0|test-user", status: "active" }));
    const database = createDatabase();
    const services = createMinimalServices({ users, database });
    const app = createTestApp(config, services, {
      getJobStatus: () => Effect.succeed(ownedJob("user-1"))
    });
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const up = await app.request("/me/executions/job-1/reaction", {
      method: "POST",
      headers,
      body: JSON.stringify({ reaction: "up", reason: "great output" })
    });
    expect(up.status).toBe(200);
    expect(await up.json()).toMatchObject({ value: "up", reason: "great output" });

    const getAfterUp = await app.request("/me/executions/job-1", { headers });
    expect((await getAfterUp.json()).reaction).toMatchObject({ value: "up" });

    // mutable: up -> down overwrites in place, it doesn't create a second row.
    const down = await app.request("/me/executions/job-1/reaction", {
      method: "POST",
      headers,
      body: JSON.stringify({ reaction: "down" })
    });
    expect(down.status).toBe(200);
    const downBody = await down.json();
    expect(downBody.value).toBe("down");
    expect(downBody.reason).toBeUndefined();

    const stored = Effect.runSync(database.executionReactions.getByExecution("job-1"));
    expect(stored?.reaction).toBe("down");

    const deleted = await app.request("/me/executions/job-1/reaction", { method: "DELETE", headers });
    expect(deleted.status).toBe(204);

    const getAfterDelete = await app.request("/me/executions/job-1", { headers });
    expect((await getAfterDelete.json()).reaction).toBeNull();
  });
});

describe("N3 cancel route", () => {
  it("POST /me/executions/:id/cancel returns 403 when execution belongs to another user", async () => {
    const config = createTestConfig();
    const services = createMinimalServices();
    const app = createTestApp(config, services, {
      getJobStatus: () => Effect.succeed(ownedJob("other-user-id"))
    });
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });

    const response = await app.request("/me/executions/job-1/cancel", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(403);
  });

  it("is idempotent — cancelling an already-terminal execution is a 200 no-op that never calls jobs.cancelJob", async () => {
    const config = createTestConfig();
    const users = createBackendApplicationUserMemoryRepository();
    Effect.runSync(users.create({ id: "user-1", externalSubject: "auth0|test-user", status: "active" }));
    const services = createMinimalServices({ users });
    const cancelJob = vi.fn();
    const app = createTestApp(config, services, {
      getJobStatus: () => Effect.succeed(ownedJob("user-1", "done")),
      cancelJob
    });
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });

    const response = await app.request("/me/executions/job-1/cancel", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("done");
    expect(cancelJob).not.toHaveBeenCalled();
  });

  it("cancels a queued execution, forwarding the request reason, and accepts a bodyless request", async () => {
    const config = createTestConfig();
    const users = createBackendApplicationUserMemoryRepository();
    Effect.runSync(users.create({ id: "user-1", externalSubject: "auth0|test-user", status: "active" }));
    const services = createMinimalServices({ users });
    const cancelJob = vi.fn(() => Effect.succeed(ownedJob("user-1", "cancelled")));
    const app = createTestApp(config, services, {
      getJobStatus: () => Effect.succeed(ownedJob("user-1")),
      cancelJob
    });
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });

    const response = await app.request("/me/executions/job-1/cancel", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "changed my mind" })
    });

    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("cancelled");
    expect(cancelJob).toHaveBeenCalledWith("job-1", "changed my mind");

    const bodyless = await app.request("/me/executions/job-1/cancel", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(bodyless.status).toBe(200);
  });
});
