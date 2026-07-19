import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { decodeSyncExecutionView } from "@my-ai-orchestrator/contracts";
import { createBackendApp } from "../../apps/backend";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import { createBackendAppTestApp, seedExecutionVoiceState } from "./backend-app.fixtures.js";

describe("backend product bundle", () => {
  it("persists product state and exposes cost telemetry through the runtime", async () => {
    const config: BackendConfig = {
      environment: "test",
      executionMode: "sync",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR",
      serviceName: "backend",
      host: "127.0.0.1",
      port: 3000,
      version: "0.1.0",
      billingPlanId: "criador",
      billingUserId: "user_1"
    };
    const startedAt = new Date("2026-05-11T00:00:00.000Z");
    const now = new Date("2026-05-11T00:00:05.000Z");
    const services = Effect.runSync(createBackendProductServices(config, { now: () => startedAt }));
    seedExecutionVoiceState(services, "user_1");

    const app = createBackendAppTestApp(config, services);

    const response = await app.request("/me/executions/run", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        contentType: "validation-post",
        briefing: {
          topic: "Product integration",
          keyPoints: ["database", "adapters", "feature flags"]
        },
        model: "gpt-4.1",
        includeTrace: true,
        idempotencyKey: "product-m2d"
      })
    });

    const body = await response.json();
    expect(response.status).toBe(200);
    const decoded = await Effect.runPromise(decodeSyncExecutionView(body));
    expect(decoded.telemetry?.cost?.estimatedUsdCost).toBeGreaterThan(0);
    expect(decoded.telemetry?.selection?.reason).toBe("request");
    expect(decoded.telemetry?.billing?.planId).toBe("criador");
    expect(decoded.content).toContain("provider:gemini:");

    const snapshot = services.database.snapshot();
    expect(Object.keys(snapshot.contentTypes).length).toBeGreaterThan(0);
    expect(Object.keys(snapshot.memories).length).toBeGreaterThan(0);

    const ledger = services.billing.listLedger("user_1", "criador");
    expect(ledger.map((entry) => entry.entryType)).toEqual(["grant_cycle", "reserve", "capture"]);
  });
});
