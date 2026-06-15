import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { resolveBackendPublicAuthenticatedActor } from "../src/auth/public-auth.js";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import { createApplicationUserServiceLayer } from "../src/auth/application-user-service.js";
import {
  createBackendTestAccessToken,
  getBackendTestAuthProfile
} from "../src/auth/test-auth.js";
import { createTestConfig } from "./test-helpers.js";

describe("resolveBackendPublicAuthenticatedActor", () => {
  it("fails with missing_token when authorization header is absent", async () => {
    const config = createTestConfig();
    const users = createBackendApplicationUserMemoryRepository();
    const program = resolveBackendPublicAuthenticatedActor({
      config,
      route: "POST /api/run",
      readHeader: () => undefined
    }).pipe(Effect.provide(createApplicationUserServiceLayer(users)));

    const result = await Effect.runPromise(Effect.either(program));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.reason).toBe("missing_token");
    }
  });

  it("fails with invalid_token when bearer token is malformed", async () => {
    const config = createTestConfig();
    const users = createBackendApplicationUserMemoryRepository();
    const program = resolveBackendPublicAuthenticatedActor({
      config,
      route: "POST /api/run",
      readHeader: (name) => (name === "authorization" ? "Bearer not-a-jwt" : undefined)
    }).pipe(Effect.provide(createApplicationUserServiceLayer(users)));

    const result = await Effect.runPromise(Effect.either(program));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.reason).toBe("invalid_token");
    }
  });

  it("fails with invalid_token when JWT signature is invalid", async () => {
    const config = createTestConfig();
    const users = createBackendApplicationUserMemoryRepository();
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });
    // Tamper with signature to make it invalid
    const tamperedToken = token.slice(0, -10) + "0000000000";

    const program = resolveBackendPublicAuthenticatedActor({
      config,
      route: "POST /api/run",
      readHeader: (name) => (name === "authorization" ? `Bearer ${tamperedToken}` : undefined)
    }).pipe(Effect.provide(createApplicationUserServiceLayer(users)));

    const result = await Effect.runPromise(Effect.either(program));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.reason).toBe("invalid_signature");
    }
  });

  it("fails with invalid_token when subject claim is missing", async () => {
    const profile = getBackendTestAuthProfile();
    const config = createTestConfig({
      authIssuerUrl: profile.issuerUrl,
      authAudience: profile.audience,
      authJwksUrl: profile.jwksUrl
    });
    const users = createBackendApplicationUserMemoryRepository();
    const token = createBackendTestAccessToken({ userId: "auth0|test-user", subject: "" });

    const program = resolveBackendPublicAuthenticatedActor({
      config,
      route: "POST /api/run",
      readHeader: (name) => (name === "authorization" ? `Bearer ${token}` : undefined)
    }).pipe(Effect.provide(createApplicationUserServiceLayer(users)));

    const result = await Effect.runPromise(Effect.either(program));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.reason).toBe("invalid_token");
      expect(result.left.message).toContain("subject claim");
    }
  });

  it("provisions a new user when subject is not found (JIT)", async () => {
    const profile = getBackendTestAuthProfile();
    const config = createTestConfig({
      authIssuerUrl: profile.issuerUrl,
      authAudience: profile.audience,
      authJwksUrl: profile.jwksUrl
    });
    const users = createBackendApplicationUserMemoryRepository();
    const token = createBackendTestAccessToken({ userId: "auth0|new-user" });

    const program = resolveBackendPublicAuthenticatedActor({
      config,
      route: "POST /api/run",
      readHeader: (name) => (name === "authorization" ? `Bearer ${token}` : undefined)
    }).pipe(Effect.provide(createApplicationUserServiceLayer(users)));

    const result = await Effect.runPromise(Effect.either(program));
    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.userId).toBeDefined();
      // Verify user was persisted
      const persisted = await Effect.runPromise(users.findByExternalSubject("auth0|new-user"));
      expect(persisted).toBeDefined();
      expect(persisted?.status).toBe("active");
    }
  });

  it("returns existing user when subject is already known", async () => {
    const profile = getBackendTestAuthProfile();
    const config = createTestConfig({
      authIssuerUrl: profile.issuerUrl,
      authAudience: profile.audience,
      authJwksUrl: profile.jwksUrl
    });
    const users = createBackendApplicationUserMemoryRepository();
    await Effect.runPromise(
      users.create({ id: "existing-id", externalSubject: "auth0|existing-user", status: "active" })
    );
    const token = createBackendTestAccessToken({ userId: "auth0|existing-user" });

    const program = resolveBackendPublicAuthenticatedActor({
      config,
      route: "POST /api/run",
      readHeader: (name) => (name === "authorization" ? `Bearer ${token}` : undefined)
    }).pipe(Effect.provide(createApplicationUserServiceLayer(users)));

    const result = await Effect.runPromise(Effect.either(program));
    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.userId).toBe("existing-id");
    }
  });

  it("fails with BackendUserSuspendedError when user is suspended", async () => {
    const profile = getBackendTestAuthProfile();
    const config = createTestConfig({
      authIssuerUrl: profile.issuerUrl,
      authAudience: profile.audience,
      authJwksUrl: profile.jwksUrl
    });
    const users = createBackendApplicationUserMemoryRepository();
    await Effect.runPromise(
      users.create({ id: "suspended-id", externalSubject: "auth0|suspended-user", status: "suspended" })
    );
    const token = createBackendTestAccessToken({ userId: "auth0|suspended-user" });

    const program = resolveBackendPublicAuthenticatedActor({
      config,
      route: "POST /api/run",
      readHeader: (name) => (name === "authorization" ? `Bearer ${token}` : undefined)
    }).pipe(Effect.provide(createApplicationUserServiceLayer(users)));

    const result = await Effect.runPromise(Effect.either(program));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("BackendUserSuspendedError");
      expect(result.left.userId).toBe("suspended-id");
    }
  });

  it("extracts roles and permissions from token claims", async () => {
    const profile = getBackendTestAuthProfile();
    const config = createTestConfig({
      authIssuerUrl: profile.issuerUrl,
      authAudience: profile.audience,
      authJwksUrl: profile.jwksUrl
    });
    const users = createBackendApplicationUserMemoryRepository();
    const token = createBackendTestAccessToken({
      userId: "auth0|admin-user",
      roles: ["admin", "editor"],
      permissions: ["read", "write"]
    });

    const program = resolveBackendPublicAuthenticatedActor({
      config,
      route: "POST /api/run",
      readHeader: (name) => (name === "authorization" ? `Bearer ${token}` : undefined)
    }).pipe(Effect.provide(createApplicationUserServiceLayer(users)));

    const result = await Effect.runPromise(Effect.either(program));
    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.roles).toContain("admin");
      expect(result.right.roles).toContain("editor");
      expect(result.right.permissions).toContain("read");
      expect(result.right.permissions).toContain("write");
    }
  });
});
