import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import { createBackendTestAccessToken } from "../src/auth/test-auth.js";
import { createTestConfig, createMinimalServices, createTestApp } from "./test-helpers.js";

// contract-08 §4 — runnable check: a valid token against a tombstoned account must not resurrect it.
describe("account tombstone auth guard", () => {
  it("rejects a valid token for a deleted account without recreating it", async () => {
    const config = createTestConfig();
    const users = createBackendApplicationUserMemoryRepository();
    const created = Effect.runSync(
      users.create({ id: "user-1", externalSubject: "auth0|deleted-user", status: "active" })
    );
    Effect.runSync(users.tombstone(created.id, new Date()));

    const services = createMinimalServices({ users });
    const app = createTestApp(config, services);
    const token = createBackendTestAccessToken({ userId: "auth0|deleted-user" });

    const response = await app.request("/me/onboarding/status", {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(401);

    // no resurrection: still exactly the one tombstoned row under that external subject.
    const stillDeleted = Effect.runSync(users.findByExternalSubject("auth0|deleted-user"));
    expect(stillDeleted?.status).toBe("deleted");
    expect(stillDeleted?.id).toBe("user-1");
  });
});
