import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { decodeGenerationPreviewResponse } from "@my-ai-orchestrator/contracts";
import {
  backendAppTestStartedAt,
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices,
  seedExecutionVoiceState
} from "./backend-app.fixtures.js";

describe("backend generation preview", () => {
  it("returns a product-facing preview without reserving credits", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_1" });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_1_pro",
      userId: "user_1",
      planId: "pro",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });

    const app = createBackendAppTestApp(config, services);
    const reservationsBefore = services.billing.listReservations("user_1", "pro");

    const payload = {
      contentType: "newsletter",
      qualityMode: "strict",
      briefing: {
        topic: "AI policy rollout",
        audience: "backend engineers"
      }
    };

    const response = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    const decoded = await Effect.runPromise(decodeGenerationPreviewResponse(body));
    const secondResponse = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const secondDecoded = await Effect.runPromise(decodeGenerationPreviewResponse(await secondResponse.json()));

    expect(decoded.pricingSnapshot.contentType).toBe("newsletter");
    expect(decoded.pricingSnapshot.qualityMode).toBe("strict");
    expect(decoded.pricingSnapshot.creditPrice).toBe(10);
    expect(decoded.pricingSnapshot.quoteId).toMatch(/^quote_[a-f0-9]{64}$/);
    expect(secondDecoded.pricingSnapshot.quoteId).toBe(decoded.pricingSnapshot.quoteId);
    expect(decoded.recommendation?.qualityMode).toBeDefined();
    expect(decoded.recommendation?.reasonCodes.length).toBeGreaterThan(0);
    expect(decoded.currentBalance).toBe(2500);
    expect(decoded.projectedBalanceAfterGeneration).toBe(2490);
    expect(decoded.options.contentTypes.some((contentType) => contentType.id === "newsletter")).toBe(true);
    expect(decoded.options.qualityModes.find((mode) => mode.id === "strict")?.allowed).toBe(true);
    const recommended = decoded.options.qualityModes.filter((mode) => mode.recommended);
    expect(recommended).toHaveLength(1);
    expect(recommended[0]?.recommendation?.reasonCodes.length).toBeGreaterThan(0);
    expect(recommended[0]?.recommendation?.explanation.length).toBeGreaterThan(0);
    expect(services.billing.listReservations("user_1", "pro")).toEqual(reservationsBefore);
  });

  it("keeps the recommendation inside the currently allowed quality modes", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_2" });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_2_pro",
      userId: "user_2",
      planId: "pro",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });
    seedExecutionVoiceState(services, "user_2");

    await Effect.runPromise(services.billing.consumeCredits("user_2", "pro", 2498, "generation"));

    const app = createBackendAppTestApp(config, services);
    const response = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: "user_2",
        contentType: "architecture-post",
        briefing: {
          systemContext: "We need to separate product orchestration from runtime execution and preserve quote integrity.",
          tradeoffs: ["coordination overhead", "clearer ownership", "lower drift risk"],
          decision: "Adopt immutable snapshots."
        }
      })
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    const decoded = await Effect.runPromise(decodeGenerationPreviewResponse(body));
    const recommended = decoded.options.qualityModes.find((mode) => mode.recommended);

    expect(decoded.currentBalance).toBe(2);
    expect(decoded.options.qualityModes.find((mode) => mode.id === "fast")?.allowed).toBe(true);
    expect(decoded.options.qualityModes.find((mode) => mode.id === "balanced")?.allowed).toBe(false);
    expect(decoded.options.qualityModes.find((mode) => mode.id === "strict")?.allowed).toBe(false);
    expect(recommended?.id).toBe("fast");
    expect(recommended?.recommendation?.reasonCodes).toContain("allowed_option_guard");
  });
});
