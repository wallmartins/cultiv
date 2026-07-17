import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import { createBackendOperatorMemoryRepository } from "../src/auth/operator-memory.js";
import { createBackendTestAccessToken } from "../src/auth/test-auth.js";
import { createTestConfig, createMinimalServices, createTestApp } from "./test-helpers.js";
import {
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices,
  seedExecutionVoiceState
} from "../../../tests/backend/backend-app.fixtures.js";

describe("Public Route Auth Integration", () => {
  it("POST /me/executions/run returns 401 when token is missing", async () => {
    const config = createTestConfig();
    const services = createMinimalServices();
    const app = createTestApp(config, services);

    const response = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: "linkedin-post", briefing: "Test" })
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("authentication_missing_token");
  });

  it("POST /me/executions/run returns 401 when token is invalid", async () => {
    const config = createTestConfig();
    const services = createMinimalServices();
    const app = createTestApp(config, services);
    const response = await app.request("/me/executions/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid-token"
      },
      body: JSON.stringify({ contentType: "linkedin-post", briefing: "Test" })
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("authentication_invalid_token");
  });

  it("POST /me/executions/run returns 403 when user is suspended", async () => {
    const config = createTestConfig();
    const users = createBackendApplicationUserMemoryRepository();
    Effect.runSync(
      users.create({ id: "suspended-1", externalSubject: "auth0|suspended-user", status: "suspended" })
    );
    const services = createMinimalServices({ users });
    const app = createTestApp(config, services);
    const token = createBackendTestAccessToken({ userId: "auth0|suspended-user" });

    const response = await app.request("/me/executions/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ contentType: "linkedin-post", briefing: "Test" })
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("user_suspended");
  });

  it("POST /api/run returns 410 Gone with migration note", async () => {
    const config = createTestConfig();
    const services = createMinimalServices();
    const app = createTestApp(config, services);

    const response = await app.request("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: "linkedin-post", briefing: "Test" })
    });

    expect(response.status).toBe(410);
    const body = await response.json();
    expect(body.message).toContain("/me/executions/run");
    expect(body.details?.migration).toBe("POST /me/executions/run");
  });

  it("POST /me/executions/run returns 200 when token is valid", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "auth0|test-user", billingPlanId: "criador" });
    const services = createBackendAppTestServices(config);
    seedExecutionVoiceState(services, "auth0|test-user");
    const app = createBackendAppTestApp(config, services);
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });

    const response = await app.request("/me/executions/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ contentType: "linkedin-post", briefing: "Test" })
    });

    expect(response.status).toBe(200);
  });
});

describe("Operational Route Auth Integration", () => {
  it("GET /api/internal/policies returns 401 when operator is not found", async () => {
    const config = createTestConfig();
    const services = createMinimalServices();
    const app = createTestApp(config, services);
    const token = createBackendTestAccessToken({ userId: "op-unknown" });

    const response = await app.request("/api/internal/policies", {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("authentication_invalid_token");
  });

  it("GET /api/internal/policies returns 403 when operator lacks permission", async () => {
    const config = createTestConfig();
    const operators = createBackendOperatorMemoryRepository();
    Effect.runSync(
      operators.create({ id: "op-1", permissions: ["other.permission"], roles: ["admin"], status: "active" })
    );
    const services = createMinimalServices({ operators });
    const app = createTestApp(config, services);
    const token = createBackendTestAccessToken({ userId: "op-1" });

    const response = await app.request("/api/internal/policies", {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("authorization_insufficient_permission");
  });

  it("GET /api/internal/policies returns 200 when operator has permission", async () => {
    const config = createTestConfig();
    const operators = createBackendOperatorMemoryRepository();
    Effect.runSync(
      operators.create({ id: "op-1", permissions: ["ai_policy.activate"], roles: ["admin"], status: "active" })
    );
    const services = createMinimalServices({ operators });
    const app = createTestApp(config, services);
    const token = createBackendTestAccessToken({ userId: "op-1" });

    const response = await app.request("/api/internal/policies", {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.availableVersions).toBeDefined();
  });
});
