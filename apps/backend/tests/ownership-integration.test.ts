import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import { createBackendTestAccessToken } from "../src/auth/test-auth.js";
import { createTestConfig, createMinimalServices, createTestApp } from "./test-helpers.js";

describe("Public Route Ownership Enforcement", () => {
  it("GET /me/executions returns 401 when token is missing", async () => {
    const config = createTestConfig();
    const services = createMinimalServices();
    const app = createTestApp(config, services);

    const response = await app.request("/me/executions", {
      headers: { "Content-Type": "application/json" }
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("authentication_missing_token");
  });

  it("GET /me/executions returns only jobs owned by authenticated user", async () => {
    const config = createTestConfig();
    const users = createBackendApplicationUserMemoryRepository();
    Effect.runSync(users.create({ id: "user-1", externalSubject: "auth0|test-user", status: "active" }));
    const services = createMinimalServices({ users });
    const app = createTestApp(config, services, {
      listJobsForUser: (userId) =>
        Effect.succeed({
          items:
            userId === "user-1"
              ? [
                  {
                    jobId: "job-owner",
                    status: "queued" as const,
                    contentType: "twitter-thread",
                    progress: null,
                    result: null,
                    error: null,
                    createdAt: new Date().toISOString(),
                    completedAt: null,
                    userId: "user-1"
                  }
                ]
              : [],
          total: userId === "user-1" ? 1 : 0
        })
    });
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });

    const response = await app.request("/me/executions", {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].jobId).toBe("job-owner");
  });

  it("GET /me/executions/:executionId returns 403 when execution belongs to another user", async () => {
    const config = createTestConfig();
    const services = createMinimalServices();
    const app = createTestApp(config, services, {
      getJobStatus: () => Effect.succeed({
        jobId: "job-1",
        status: "queued" as const,
        contentType: "twitter-thread",
        progress: null,
        result: null,
        error: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
        userId: "other-user-id"
      })
    });
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });

    const response = await app.request("/me/executions/job-1", {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("authorization_not_owner");
  });
});
