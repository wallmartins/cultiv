import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { decodeGenerationPreviewResponse } from "@my-ai-orchestrator/contracts";
import { createBackendTestAuthorizationHeader } from "../../apps/backend/src/auth/test-auth.js";
import {
  backendAppTestStartedAt,
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices,
  seedExecutionVoiceState
} from "./backend-app.fixtures.js";

describe("backend free tier quality modes", () => {
  it("allows all content types but only fast quality mode on free plan", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_free" });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_free",
      userId: "user_free",
      planId: "free",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });

    await Effect.runPromise(
      services.billing.startCycle({
        userId: "user_free",
        planId: "free",
        cycleId: "user_free:free:cycle:test",
        idempotencyKey: "test:user_free:free:cycle"
      })
    );

    const app = createBackendAppTestApp(config, services);

    const contentTypesResponse = await app.request("/me/content-types");
    expect(contentTypesResponse.status).toBe(200);
    const contentTypesBody = await contentTypesResponse.json();
    expect(contentTypesBody.items.length).toBe(6);
    expect(contentTypesBody.items.every((item: { available: boolean }) => item.available)).toBe(true);
    expect(contentTypesBody.commercial.allowedQualityModes).toEqual(["fast"]);

    const previewResponse = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contentType: "linkedin-post",
        qualityMode: "strict",
        briefing: {
          topic: "Monorepo trade-offs",
          audience: "Senior engineers"
        }
      })
    });

    expect(previewResponse.status).toBe(200);
    const decoded = await Effect.runPromise(decodeGenerationPreviewResponse(await previewResponse.json()));

    expect(decoded.options.qualityModes.find((mode) => mode.id === "fast")?.allowed).toBe(true);
    expect(decoded.options.qualityModes.find((mode) => mode.id === "balanced")?.allowed).toBe(false);
    expect(decoded.options.qualityModes.find((mode) => mode.id === "balanced")?.blockedReason).toBe(
      "quality_mode_plan_restriction"
    );
    expect(decoded.options.qualityModes.find((mode) => mode.id === "strict")?.allowed).toBe(false);
    expect(decoded.pricingSnapshot.qualityMode).toBe("fast");
  });

  it("provisions a free subscription on the first authenticated catalog request", async () => {
    const config = createBackendAppTestConfig();
    const services = createBackendAppTestServices(config);
    const app = createBackendAppTestApp(config, services);
    const userId = "user_jit_catalog";

    expect(services.billing.getEntitlement(userId)).toBeUndefined();

    const response = await app.request("/me/content-types", {
      headers: {
        authorization: createBackendTestAuthorizationHeader({ userId })
      }
    });
    expect(response.status).toBe(200);

    const entitlement = services.billing.getEntitlement(userId);
    expect(entitlement?.planId).toBe("free");
    expect(entitlement?.status).toBe("active");
    expect(entitlement?.wallet.availableCredits).toBe(50);
  });

  it("allows fast generation on free plan when server default quality mode is balanced", async () => {
    const config = createBackendAppTestConfig({
      serviceName: "cultiv",
      qualityMode: "balanced",
      billingPlanId: "free",
      executionMode: "sync"
    });
    const services = createBackendAppTestServices(config);
    const userId = "user_cultiv_fast";

    services.billing.upsertSubscription({
      id: `sub_${userId}`,
      userId,
      planId: "free",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });

    await Effect.runPromise(
      services.billing.startCycle({
        userId,
        planId: "free",
        cycleId: `${userId}:free:cycle:test`,
        idempotencyKey: `test:${userId}:free:cycle`
      })
    );

    seedExecutionVoiceState(services, userId);
    const app = createBackendAppTestApp(config, services);

    const response = await app.request("/me/executions/run", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: createBackendTestAuthorizationHeader({ userId })
      },
      body: JSON.stringify({
        contentType: "linkedin-post",
        qualityMode: "fast",
        briefing: {
          topic: "Monorepo trade-offs",
          audience: "Senior engineers"
        }
      })
    });

    expect(response.status).toBe(200);
  });
});
