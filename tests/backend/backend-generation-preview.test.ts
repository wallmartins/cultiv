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
      id: "sub_user_1_criador",
      userId: "user_1",
      planId: "criador",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });

    const app = createBackendAppTestApp(config, services);
    const reservationsBefore = services.billing.listReservations("user_1", "criador");

    const payload = {
      rhetoricalMode: "promote",
      scope: { lengthTier: "medium", channel: "email" },
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

    expect(decoded.pricingSnapshot.contentType).toBe("edition-piece");
    expect(decoded.pricingSnapshot.qualityMode).toBe("strict");
    expect(decoded.pricingSnapshot.creditPrice).toBe(5);
    expect(decoded.pricingSnapshot.quoteId).toMatch(/^quote_[a-f0-9]{64}$/);
    expect(secondDecoded.pricingSnapshot.quoteId).toBe(decoded.pricingSnapshot.quoteId);
    expect(decoded.recommendation?.qualityMode).toBeDefined();
    expect(decoded.recommendation?.reasonCodes.length).toBeGreaterThan(0);
    expect(decoded.currentBalance).toBe(300);
    expect(decoded.projectedBalanceAfterGeneration).toBe(295);
    expect(decoded.quotaCost).toBeGreaterThanOrEqual(1);
    expect(decoded.quotaLimit).toBeGreaterThan(0);
    expect(decoded.quotaRemaining).toBeLessThanOrEqual(decoded.quotaLimit);
    expect(decoded.currentBalance).toBeTypeOf("number");
    expect(decoded.canonicalCreditCost).toBe(2.5);
    expect(decoded.options.qualityModes.find((mode) => mode.id === "strict")?.allowed).toBe(true);
    const recommended = decoded.options.qualityModes.filter((mode) => mode.recommended);
    expect(recommended).toHaveLength(1);
    expect(recommended[0]?.recommendation?.reasonCodes.length).toBeGreaterThan(0);
    expect(recommended[0]?.recommendation?.explanation.length).toBeGreaterThan(0);
    expect(services.billing.listReservations("user_1", "criador")).toEqual(reservationsBefore);
  });

  // ADR 0009 — o plano é o teto de refino. O briefing abaixo é dos que a inferência
  // classifica como strict (contexto rico, tipo complexo), mas explorador é tier starter,
  // então a recomendação tem que parar em balanced. Depois da policy 2026-07-20 o preço não
  // varia por modo, então quem limita o modo é o tier, não o saldo.
  it("limita a recomendação ao teto de refino do plano", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_2" });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_2_explorador",
      userId: "user_2",
      planId: "explorador",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });
    seedExecutionVoiceState(services, "user_2");

    const app = createBackendAppTestApp(config, services);
    const response = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: "user_2",
        rhetoricalMode: "expound",
        scope: { lengthTier: "long" },
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

    expect(decoded.options.qualityModes.find((mode) => mode.id === "fast")?.allowed).toBe(true);
    expect(decoded.options.qualityModes.find((mode) => mode.id === "balanced")?.allowed).toBe(true);
    expect(decoded.options.qualityModes.find((mode) => mode.id === "strict")?.allowed).toBe(false);
    expect(recommended?.id).toBe("balanced");
    expect(recommended?.recommendation?.reasonCodes).toContain("allowed_option_guard");
    // o modo escolhido é o que a fatura usa: preço por tamanho, não por refino
    expect(decoded.pricingSnapshot.qualityMode).toBe("balanced");
  });

  it("resolves expound short to short-piece pricing", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_intent_preview" });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_intent_preview_pro",
      userId: "user_intent_preview",
      planId: "criador",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });

    const app = createBackendAppTestApp(config, services);
    const response = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rhetoricalMode: "expound",
        scope: { lengthTier: "short" },
        briefing: {
          topic: "Delegating product decisions"
        }
      })
    });

    expect(response.status).toBe(200);

    const decoded = await Effect.runPromise(decodeGenerationPreviewResponse(await response.json()));

    expect(decoded.pricingSnapshot.contentType).toBe("short-piece");
    expect(decoded.pricingSnapshot.creditPrice).toBeGreaterThan(0);
    expect(decoded.compositor?.lengthTier).toBe("short");
  });

  it("rejects preview requests without a generation scope", async () => {
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
        rhetoricalMode: "promote",
        scope: { lengthTier: "medium", channel: "email" },
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
