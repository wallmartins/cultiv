import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { decodeGenerationPreviewResponse, resolvePhase1LegacyContentTypeId } from "@my-ai-orchestrator/contracts";
import { resolveEffectiveWordTarget, toIntentWordTarget } from "@my-ai-orchestrator/text-quality";
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
    expect(decoded.currentBalance).toBe(150);
    expect(decoded.projectedBalanceAfterGeneration).toBe(140);
    expect(decoded.quotaCost).toBeGreaterThanOrEqual(1);
    expect(decoded.quotaLimit).toBeGreaterThan(0);
    expect(decoded.quotaRemaining).toBeLessThanOrEqual(decoded.quotaLimit);
    expect(decoded.currentBalance).toBeTypeOf("number");
    expect(decoded.canonicalCreditCost).toBe(2.5);
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

    await Effect.runPromise(services.billing.consumeCredits("user_2", "pro", 148, "generation"));

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

  it("resolves share-idea short to linkedin-post pricing with resolvedIntent", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_intent_preview" });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_intent_preview_pro",
      userId: "user_intent_preview",
      planId: "pro",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });

    const app = createBackendAppTestApp(config, services);
    const response = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        intent: "share-idea",
        scope: { lengthTier: "short" },
        briefing: {
          topic: "Delegating product decisions"
        }
      })
    });

    expect(response.status).toBe(200);

    const decoded = await Effect.runPromise(decodeGenerationPreviewResponse(await response.json()));

    expect(decoded.pricingSnapshot.contentType).toBe("linkedin-post");
    expect(decoded.pricingSnapshot.creditPrice).toBeGreaterThan(0);
    const wordTarget = toIntentWordTarget(
      resolveEffectiveWordTarget({
        contentType: resolvePhase1LegacyContentTypeId("share-idea", "short"),
        lengthTier: "short"
      })
    );

    expect(decoded.resolvedIntent).toEqual({
      intent: "share-idea",
      scope: { lengthTier: "short" },
      wordTargetMin: wordTarget.min,
      wordTargetMax: wordTarget.max
    });
  });

  it("rejects preview requests without intent+scope or contentType", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_preview_validation" });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_preview_validation_pro",
      userId: "user_preview_validation",
      planId: "pro",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });

    const app = createBackendAppTestApp(config, services);
    const response = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        briefing: { topic: "Missing target" }
      })
    });

    expect(response.status).toBe(400);
  });

  it("skips recommendation when includeRecommendation is false", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_3" });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_3_pro",
      userId: "user_3",
      planId: "pro",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });

    const app = createBackendAppTestApp(config, services);
    const response = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contentType: "newsletter",
        qualityMode: "strict",
        includeRecommendation: false,
        briefing: {
          topic: "AI policy rollout",
          audience: "backend engineers"
        }
      })
    });

    expect(response.status).toBe(200);

    const decoded = await Effect.runPromise(decodeGenerationPreviewResponse(await response.json()));

    expect(decoded.recommendation).toBeUndefined();
    expect(decoded.options.qualityModes.every((mode) => !mode.recommended)).toBe(true);
    expect(decoded.pricingSnapshot.quoteId).toMatch(/^quote_[a-f0-9]{64}$/);
  });
});
