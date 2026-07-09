import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  decodeApiErrorResponse,
  decodeHealthCheckResponse,
  decodeReadinessResponse
} from "@my-ai-orchestrator/contracts";
import { createDatabase } from "../../packages/database/src/index.js";
import {
  createBackendApp,
  createBackendProductServices,
  type BackendConfig
} from "../../apps/backend";
import {
  createBackendTestAuthorizationHeader,
  getBackendTestAuthProfile
} from "../../apps/backend/src/auth/index.js";

const productionNow = new Date("2026-06-01T12:00:00.000Z");

describe("backend production hardening", () => {
  it("separates liveness from readiness and blocks traffic when readiness is unhealthy", async () => {
    const config = createProductionConfig();
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => productionNow,
        database: createDatabase()
      })
    );
    const app = createBackendApp(config, {
      startedAt: new Date("2026-06-01T11:59:55.000Z"),
      now: () => productionNow,
      services
    });

    const healthResponse = await app.request("/health");
    const readyResponse = await app.request("/ready");
    const trafficResponse = await app.request("/api/generation-preview", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        contentType: "validation-post",
        briefing: "Gate traffic while readiness is blocked"
      })
    });

    expect(healthResponse.status).toBe(200);
    expect(readyResponse.status).toBe(503);
    expect(trafficResponse.status).toBe(503);

    const health = await Effect.runPromise(decodeHealthCheckResponse(await healthResponse.json()));
    const readiness = await Effect.runPromise(decodeReadinessResponse(await readyResponse.json()));
    const trafficError = await Effect.runPromise(decodeApiErrorResponse(await trafficResponse.json()));

    expect(health.status).toBe("ok");
    expect(readiness.status).toBe("blocked");
    expect(readiness.checks.config.status).toBe("ready");
    expect(readiness.checks.database.status).toBe("blocked");
    expect(trafficError.code).toBe("service_unavailable");
    expect(trafficError.details?.reason).toBe("database");
  });

  it("applies production security headers and CORS behavior through observable responses", async () => {
    const config = createProductionConfig({
      corsAllowedOrigins: ["https://app.example.com"]
    });
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => productionNow,
        database: createDatabase()
      })
    );
    const app = createBackendApp(config, {
      startedAt: new Date("2026-06-01T11:59:55.000Z"),
      now: () => productionNow,
      services,
      hardeningChecks: {
        auth: () => Effect.succeed(undefined),
        database: () => Effect.succeed(undefined)
      }
    });

    const allowedPreflight = await app.request("/api/generation-preview", {
      method: "OPTIONS",
      headers: {
        origin: "https://app.example.com"
      }
    });
    const deniedPreflight = await app.request("/api/generation-preview", {
      method: "OPTIONS",
      headers: {
        origin: "https://blocked.example.com"
      }
    });
    const readyResponse = await app.request("/ready", {
      headers: {
        origin: "https://app.example.com"
      }
    });

    expect(allowedPreflight.status).toBe(204);
    expect(deniedPreflight.status).toBe(204);
    expect(allowedPreflight.headers.get("access-control-allow-origin")).toBe("https://app.example.com");
    expect(deniedPreflight.headers.get("access-control-allow-origin")).toBeNull();
    expect(allowedPreflight.headers.get("x-content-type-options")).toBe("nosniff");
    expect(allowedPreflight.headers.get("x-frame-options")).toBe("DENY");
    expect(readyResponse.headers.get("strict-transport-security")).toContain("max-age=31536000");
    expect(readyResponse.headers.get("access-control-allow-origin")).toBe("https://app.example.com");
  });

  it("rate limits repeated production traffic while keeping successful requests available first", async () => {
    const config = createProductionConfig({
      rateLimitMaxRequests: 2,
      rateLimitWindowMs: 60_000
    });
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => productionNow,
        database: createDatabase()
      })
    );
    const app = createBackendApp(config, {
      startedAt: new Date("2026-06-01T11:59:55.000Z"),
      now: () => productionNow,
      services,
      hardeningChecks: {
        auth: () => Effect.succeed(undefined),
        database: () => Effect.succeed(undefined)
      }
    });
    const authorization = createBackendTestAuthorizationHeader({ userId: "prod-user" });
    const headers = {
      authorization,
      "x-forwarded-for": "203.0.113.10"
    };

    const first = await app.request("/me/onboarding/status", { headers });
    const second = await app.request("/me/onboarding/status", { headers });
    const third = await app.request("/me/onboarding/status", { headers });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);

    const rateLimitError = await Effect.runPromise(decodeApiErrorResponse(await third.json()));
    expect(rateLimitError.code).toBe("rate_limited");
    expect(rateLimitError.category).toBe("rate_limit");
  });
});

function createProductionConfig(overrides: Partial<BackendConfig> = {}): BackendConfig {
  const authProfile = getBackendTestAuthProfile();
  return {
    environment: "production",
    executionMode: "sync",
    qualityMode: "balanced",
    defaultLanguage: "pt-BR",
    serviceName: "backend",
    host: "127.0.0.1",
    port: 3000,
    version: "0.1.0",
    authIssuerUrl: authProfile.issuerUrl,
    authAudience: authProfile.audience,
    authJwksUrl: authProfile.jwksUrl,
    databaseUrl: "postgres://backend:secret@example.com:5432/content_lib",
    ...overrides
  };
}
