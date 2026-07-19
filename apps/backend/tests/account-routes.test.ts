import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import { createBackendTestAccessToken } from "../src/auth/test-auth.js";
import { createTestConfig, createMinimalServices, createTestApp } from "./test-helpers.js";
import type { BackendAccountService } from "../src/product/account/account-service.js";
import type { AccountExportService } from "../src/product/account/account-export-service.js";
import { BackendAccountConfirmationMismatchError } from "../src/http/errors.js";

function authedServices(overrides?: Parameters<typeof createMinimalServices>[0]) {
  const users = createBackendApplicationUserMemoryRepository();
  Effect.runSync(users.create({ id: "user-1", externalSubject: "auth0|test-user", status: "active" }));
  return createMinimalServices({ users, ...overrides });
}

const AUTH_HEADERS = {
  Authorization: `Bearer ${createBackendTestAccessToken({ userId: "auth0|test-user" })}`,
  "Content-Type": "application/json"
};

describe("account routes — not configured", () => {
  it("POST /me/account/reset returns 503 when accountOps is not wired", async () => {
    const config = createTestConfig();
    const services = authedServices();
    const app = createTestApp(config, services);

    const response = await app.request("/me/account/reset", { method: "POST", headers: AUTH_HEADERS });
    expect(response.status).toBe(503);
  });

  it("DELETE /me/account returns 503 when accountOps is not wired", async () => {
    const config = createTestConfig();
    const services = authedServices();
    const app = createTestApp(config, services);

    const response = await app.request("/me/account", {
      method: "DELETE",
      headers: AUTH_HEADERS,
      body: JSON.stringify({ confirmation: "DELETE" })
    });
    expect(response.status).toBe(503);
  });
});

describe("DELETE /me/account", () => {
  // confirmation-mismatch/idempotency/gateway-cancel-abort behavior lives in accountOps.delete
  // itself (account-service.test.ts) — the route's own job is just wiring: it must pass a working
  // pre-purge closure as the 3rd argument and surface whatever accountOps.delete decides.
  it("surfaces a confirmation-mismatch failure from accountOps.delete as 400, without the route pre-empting it", async () => {
    const config = createTestConfig();
    const deleteFn = vi.fn((userId: string) =>
      Effect.fail(new BackendAccountConfirmationMismatchError({ userId }))
    );
    const accountOps = { reset: vi.fn(), delete: deleteFn } as unknown as BackendAccountService;
    const services = authedServices({ accountOps });
    const listJobsForUser = vi.fn(() => Effect.succeed({ items: [], total: 0 }));
    const app = createTestApp(config, services, { listJobsForUser });

    const response = await app.request("/me/account", {
      method: "DELETE",
      headers: AUTH_HEADERS,
      body: JSON.stringify({ confirmation: "nope" })
    });

    expect(response.status).toBe(400);
    // the stub never invoked its 3rd (prePurge) argument, mirroring the real service's behavior
    // for a mismatch — proving the route doesn't run pre-purge on its own before delegating.
    expect(listJobsForUser).not.toHaveBeenCalled();
  });

  it("wires a pre-purge closure that cancels in-flight jobs when accountOps.delete invokes it", async () => {
    const config = createTestConfig();
    // simulates the real service: confirmation ok -> invoke prePurge -> succeed.
    const deleteFn = vi.fn((_userId: string, _input: unknown, prePurge: () => Effect.Effect<void, unknown>) =>
      Effect.gen(function* () {
        yield* prePurge();
        return { status: "deleted" as const };
      })
    );
    const accountOps = { reset: vi.fn(), delete: deleteFn } as unknown as BackendAccountService;
    const services = authedServices({ accountOps });

    const cancelJob = vi.fn(() => Effect.succeed(undefined));
    const listJobsForUser = vi.fn(() =>
      Effect.succeed({
        items: [
          { jobId: "job-1", status: "queued", contentType: "twitter-thread", createdAt: new Date().toISOString(), completedAt: null, progress: null, result: null, error: null }
        ],
        total: 1
      })
    );
    const app = createTestApp(config, services, { listJobsForUser, cancelJob });

    const response = await app.request("/me/account", {
      method: "DELETE",
      headers: AUTH_HEADERS,
      body: JSON.stringify({ confirmation: "DELETE" })
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "deleted" });
    expect(cancelJob).toHaveBeenCalledWith("job-1", "account_delete");
    expect(deleteFn).toHaveBeenCalledWith("user-1", { confirmation: "DELETE" }, expect.any(Function));
  });
});

describe("POST /me/account/reset", () => {
  it("runs pre-purge then calls accountOps.reset", async () => {
    const config = createTestConfig();
    const resetFn = vi.fn(() => Effect.succeed({ onboardingRequired: true, hasVoiceProfile: false }));
    const accountOps = { reset: resetFn, delete: vi.fn() } as unknown as BackendAccountService;
    const services = authedServices({ accountOps });
    const cancelJob = vi.fn(() => Effect.succeed(undefined));
    const listJobsForUser = vi.fn(() => Effect.succeed({ items: [], total: 0 }));
    const app = createTestApp(config, services, { listJobsForUser, cancelJob });

    const response = await app.request("/me/account/reset", { method: "POST", headers: AUTH_HEADERS });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ onboardingRequired: true, hasVoiceProfile: false });
    expect(resetFn).toHaveBeenCalledWith("user-1");
  });
});

describe("account export routes", () => {
  it("POST /me/account/export delegates to accountExport.requestExport", async () => {
    const config = createTestConfig();
    const requestExport = vi.fn(() =>
      Effect.succeed({ jobId: "export-1", status: "ready" as const, downloadUrl: "/me/account/export/export-1/download", expiresAt: null })
    );
    const accountExport = { requestExport, getExportStatus: vi.fn() } as unknown as AccountExportService;
    const services = authedServices({ accountExport });
    const app = createTestApp(config, services);

    const response = await app.request("/me/account/export", { method: "POST", headers: AUTH_HEADERS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.jobId).toBe("export-1");
    expect(requestExport).toHaveBeenCalledWith("user-1");
  });

  it("GET download returns 503 when Redis is not configured", async () => {
    const config = createTestConfig();
    const services = authedServices();
    const app = createTestApp(config, services);

    const response = await app.request("/me/account/export/export-1/download", { headers: AUTH_HEADERS });
    expect(response.status).toBe(503);
  });
});
