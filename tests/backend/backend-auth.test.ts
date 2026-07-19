import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { decodeApiErrorResponse } from "@my-ai-orchestrator/contracts";
import { createBackendApp, createBackendProductServices } from "../../apps/backend";
import type { BackendConfig } from "../../apps/backend";
import { createBackendTestAuthorizationHeader } from "../../apps/backend/src/auth/index.js";

describe("backend Auth0 public authentication", () => {
  const config: BackendConfig = {
    environment: "test",
    executionMode: "sync",
    qualityMode: "balanced",
    defaultLanguage: "pt-BR",
    serviceName: "backend",
    host: "127.0.0.1",
    port: 3000,
    version: "0.1.0"
  };

  it("accepts a valid bearer token on a public route", async () => {
    const services = Effect.runSync(createBackendProductServices(config, { now: () => new Date("2026-05-11T00:00:00.000Z") }));
    const app = createBackendApp(config, {
      startedAt: new Date("2026-05-11T00:00:00.000Z"),
      now: () => new Date("2026-05-11T00:00:05.000Z"),
      services
    });

    const response = await app.request("/me/onboarding/status", {
      headers: {
        authorization: createBackendTestAuthorizationHeader({ userId: "user_1" })
      }
    });

    expect(response.status).toBe(200);
  });

  it("rejects missing bearer tokens", async () => {
    const services = Effect.runSync(createBackendProductServices(config, { now: () => new Date("2026-05-11T00:00:00.000Z") }));
    const app = createBackendApp(config, {
      startedAt: new Date("2026-05-11T00:00:00.000Z"),
      now: () => new Date("2026-05-11T00:00:05.000Z"),
      services
    });

    const response = await app.request("/me/onboarding/status");
    expect(response.status).toBe(401);

    const body = await response.json();
    const decoded = await Effect.runPromise(decodeApiErrorResponse(body));
    expect(decoded.code).toBe("authentication_missing_token");
    expect(decoded.category).toBe("authentication");
    expect(decoded.details?.reason).toBe("missing_token");
  });

  it("rejects expired bearer tokens", async () => {
    const services = Effect.runSync(createBackendProductServices(config, { now: () => new Date("2026-05-11T00:00:00.000Z") }));
    const app = createBackendApp(config, {
      startedAt: new Date("2026-05-11T00:00:00.000Z"),
      now: () => new Date("2026-05-11T00:00:05.000Z"),
      services
    });

    const response = await app.request("/me/onboarding/status", {
      headers: {
        authorization: createBackendTestAuthorizationHeader({
          userId: "user_1",
          expiresAt: new Date("2026-05-10T23:59:00.000Z")
        })
      }
    });

    expect(response.status).toBe(401);

    const body = await response.json();
    const decoded = await Effect.runPromise(decodeApiErrorResponse(body));
    expect(decoded.code).toBe("authentication_expired_token");
    expect(decoded.category).toBe("authentication");
    expect(decoded.details?.reason).toBe("expired_token");
  });
});
