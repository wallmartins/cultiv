import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import { createBackendOperatorMemoryRepository } from "../src/auth/operator-memory.js";
import { createApplicationUserServiceLayer } from "../src/auth/application-user-service.js";
import { createOperatorServiceLayer } from "../src/auth/operator-service.js";
import {
  createBackendTestAccessToken,
  getBackendTestAuthProfile
} from "../src/auth/test-auth.js";
import { resolveBackendPublicAuthenticatedActor } from "../src/auth/public-auth.js";
import { resolveBackendOperationalActor } from "../src/auth/operational-auth.js";
import { requireBackendPermission } from "../src/auth/legacy-auth.js";
import { BackendUserSuspendedError, BackendAuthorizationError } from "../src/http/errors.js";
import { createTestConfig } from "./test-helpers.js";

describe("Application User Repository", () => {
  it("creates a user and finds it by id", () => {
    const repo = createBackendApplicationUserMemoryRepository();
    const user = Effect.runSync(
      repo.create({ id: "user-1", externalSubject: "auth0|123", status: "active" })
    );

    expect(user.id).toBe("user-1");
    expect(user.externalSubject).toBe("auth0|123");
    expect(user.status).toBe("active");

    const found = Effect.runSync(repo.findById("user-1"));
    expect(found).toBeDefined();
    expect(found!.id).toBe("user-1");
  });

  it("finds a user by external subject", () => {
    const repo = createBackendApplicationUserMemoryRepository();
    Effect.runSync(
      repo.create({ id: "user-1", externalSubject: "auth0|123", status: "active" })
    );

    const found = Effect.runSync(repo.findByExternalSubject("auth0|123"));
    expect(found).toBeDefined();
    expect(found!.id).toBe("user-1");
  });

  it("returns undefined when user is not found", () => {
    const repo = createBackendApplicationUserMemoryRepository();

    const byId = Effect.runSync(repo.findById("non-existent"));
    expect(byId).toBeUndefined();

    const bySubject = Effect.runSync(repo.findByExternalSubject("non-existent"));
    expect(bySubject).toBeUndefined();
  });

  it("idempotently provisions a user on repeated external subjects", () => {
    const repo = createBackendApplicationUserMemoryRepository();
    const first = Effect.runSync(
      repo.create({ id: "user-1", externalSubject: "auth0|123", status: "active" })
    );

    const second = Effect.runSync(
      repo.create({ id: "user-2", externalSubject: "auth0|123", status: "active" })
    );

    expect(first.id).toBe("user-1");
    expect(second.id).toBe("user-2");

    const bySubject = Effect.runSync(repo.findByExternalSubject("auth0|123"));
    expect(bySubject!.id).toBe("user-2");
  });
});

describe("Public Auth JIT Provisioning", () => {
  it("provisions an Application User on first authenticated request", async () => {
    const repo = createBackendApplicationUserMemoryRepository();
    const config = createTestConfig();
    const token = createBackendTestAccessToken({ userId: "auth0|new-user" });

    const actor = await Effect.runPromise(
      resolveBackendPublicAuthenticatedActor({
        config,
        route: "POST /me/executions/run",
        readHeader: (name) => (name.toLowerCase() === "authorization" ? `Bearer ${token}` : undefined)
      }).pipe(
        Effect.provide(createApplicationUserServiceLayer(repo))
      )
    );

    expect(actor.userId).toBeDefined();
    expect(actor.userId).not.toBe("auth0|new-user");

    const provisioned = Effect.runSync(repo.findById(actor.userId));
    expect(provisioned).toBeDefined();
    expect(provisioned!.externalSubject).toBe("auth0|new-user");
    expect(provisioned!.status).toBe("active");
  });

  it("reuses the same local user id on repeated requests with the same sub", async () => {
    const repo = createBackendApplicationUserMemoryRepository();
    const config = createTestConfig();
    const token = createBackendTestAccessToken({ userId: "auth0|repeat-user" });

    const first = await Effect.runPromise(
      resolveBackendPublicAuthenticatedActor({
        config,
        route: "POST /me/executions/run",
        readHeader: (name) => (name.toLowerCase() === "authorization" ? `Bearer ${token}` : undefined)
      }).pipe(
        Effect.provide(createApplicationUserServiceLayer(repo))
      )
    );

    const second = await Effect.runPromise(
      resolveBackendPublicAuthenticatedActor({
        config,
        route: "POST /me/executions/run",
        readHeader: (name) => (name.toLowerCase() === "authorization" ? `Bearer ${token}` : undefined)
      }).pipe(
        Effect.provide(createApplicationUserServiceLayer(repo))
      )
    );

    expect(first.userId).toBe(second.userId);

    const provisioned = Effect.runSync(repo.findByExternalSubject("auth0|repeat-user"));
    expect(provisioned).toBeDefined();
    expect(provisioned!.id).toBe(first.userId);
  });

  it("provisions distinct local users for different external subjects", async () => {
    const repo = createBackendApplicationUserMemoryRepository();
    const config = createTestConfig();
    const tokenA = createBackendTestAccessToken({ userId: "auth0|user-a" });
    const tokenB = createBackendTestAccessToken({ userId: "auth0|user-b" });

    const actorA = await Effect.runPromise(
      resolveBackendPublicAuthenticatedActor({
        config,
        route: "POST /me/executions/run",
        readHeader: (name) => (name.toLowerCase() === "authorization" ? `Bearer ${tokenA}` : undefined)
      }).pipe(
        Effect.provide(createApplicationUserServiceLayer(repo))
      )
    );

    const actorB = await Effect.runPromise(
      resolveBackendPublicAuthenticatedActor({
        config,
        route: "POST /me/executions/run",
        readHeader: (name) => (name.toLowerCase() === "authorization" ? `Bearer ${tokenB}` : undefined)
      }).pipe(
        Effect.provide(createApplicationUserServiceLayer(repo))
      )
    );

    expect(actorA.userId).not.toBe(actorB.userId);
  });

  it("blocks access when local user is suspended", async () => {
    const repo = createBackendApplicationUserMemoryRepository();
    const config = createTestConfig();
    const token = createBackendTestAccessToken({ userId: "auth0|suspended-user" });

    Effect.runSync(
      repo.create({ id: "suspended-1", externalSubject: "auth0|suspended-user", status: "suspended" })
    );

    const result = await Effect.runPromise(
      Effect.either(
        resolveBackendPublicAuthenticatedActor({
          config,
          route: "POST /me/executions/run",
          readHeader: (name) => (name.toLowerCase() === "authorization" ? `Bearer ${token}` : undefined)
        }).pipe(
          Effect.provide(createApplicationUserServiceLayer(repo))
        )
      )
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(BackendUserSuspendedError);
      const error = result.left as BackendUserSuspendedError;
      expect(error.userId).toBe("suspended-1");
      expect(error.externalSubject).toBe("auth0|suspended-user");
    }
  });

  it("allows access when local user is active", async () => {
    const repo = createBackendApplicationUserMemoryRepository();
    const config = createTestConfig();
    const token = createBackendTestAccessToken({ userId: "auth0|active-user" });

    Effect.runSync(
      repo.create({ id: "active-1", externalSubject: "auth0|active-user", status: "active" })
    );

    const actor = await Effect.runPromise(
      resolveBackendPublicAuthenticatedActor({
        config,
        route: "POST /me/executions/run",
        readHeader: (name) => (name.toLowerCase() === "authorization" ? `Bearer ${token}` : undefined)
      }).pipe(
        Effect.provide(createApplicationUserServiceLayer(repo))
      )
    );

    expect(actor.userId).toBe("active-1");
  });
});

describe("Operator Repository", () => {
  it("creates an operator and finds it by id", () => {
    const repo = createBackendOperatorMemoryRepository();
    const operator = Effect.runSync(
      repo.create({ id: "op-1", permissions: ["ai_policy.activate"], roles: ["admin"], status: "active" })
    );

    expect(operator.id).toBe("op-1");
    expect(operator.permissions).toEqual(["ai_policy.activate"]);
    expect(operator.roles).toEqual(["admin"]);
    expect(operator.status).toBe("active");

    const found = Effect.runSync(repo.findById("op-1"));
    expect(found).toBeDefined();
    expect(found!.id).toBe("op-1");
  });

  it("returns undefined when operator is not found", () => {
    const repo = createBackendOperatorMemoryRepository();
    const found = Effect.runSync(repo.findById("non-existent"));
    expect(found).toBeUndefined();
  });
});

describe("Operational Auth", () => {
  it("resolves an active operator from a valid token", async () => {
    const repo = createBackendOperatorMemoryRepository();
    const config = createTestConfig();
    const token = createBackendTestAccessToken({ userId: "op-active" });

    Effect.runSync(
      repo.create({ id: "op-active", permissions: ["ai_policy.activate"], roles: ["admin"], status: "active" })
    );

    const actor = await Effect.runPromise(
      resolveBackendOperationalActor({
        config,
        route: "GET /api/internal/policies",
        readHeader: (name) => (name.toLowerCase() === "authorization" ? `Bearer ${token}` : undefined)
      }).pipe(
        Effect.provide(createOperatorServiceLayer(repo))
      )
    );

    expect(actor.userId).toBe("op-active");
    expect(actor.permissions).toContain("ai_policy.activate");
    expect(actor.roles).toContain("admin");
  });

  it("fails when operator is not found", async () => {
    const repo = createBackendOperatorMemoryRepository();
    const config = createTestConfig();
    const token = createBackendTestAccessToken({ userId: "op-unknown" });

    const result = await Effect.runPromise(
      Effect.either(
        resolveBackendOperationalActor({
          config,
          route: "GET /api/internal/policies",
          readHeader: (name) => (name.toLowerCase() === "authorization" ? `Bearer ${token}` : undefined)
        }).pipe(
          Effect.provide(createOperatorServiceLayer(repo))
        )
      )
    );

    expect(result._tag).toBe("Left");
  });

  it("fails when operator is suspended", async () => {
    const repo = createBackendOperatorMemoryRepository();
    const config = createTestConfig();
    const token = createBackendTestAccessToken({ userId: "op-suspended" });

    Effect.runSync(
      repo.create({ id: "op-suspended", permissions: ["ai_policy.activate"], roles: ["admin"], status: "suspended" })
    );

    const result = await Effect.runPromise(
      Effect.either(
        resolveBackendOperationalActor({
          config,
          route: "GET /api/internal/policies",
          readHeader: (name) => (name.toLowerCase() === "authorization" ? `Bearer ${token}` : undefined)
        }).pipe(
          Effect.provide(createOperatorServiceLayer(repo))
        )
      )
    );

    expect(result._tag).toBe("Left");
  });

  it("blocks operator without required permission", async () => {
    const actor = { userId: "op-1", roles: ["admin"], permissions: ["other.permission"] };
    const result = await Effect.runPromise(
      Effect.either(requireBackendPermission(actor, "ai_policy.activate"))
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(BackendAuthorizationError);
      expect(result.left.reason).toBe("missing_permission");
    }
  });

  it("allows operator with required permission", async () => {
    const actor = { userId: "op-1", roles: ["admin"], permissions: ["ai_policy.activate"] };
    const result = await Effect.runPromise(
      Effect.either(requireBackendPermission(actor, "ai_policy.activate"))
    );

    expect(result._tag).toBe("Right");
  });
});
