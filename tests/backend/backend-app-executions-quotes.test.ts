import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  decodeApiErrorResponse,
  decodeGenerationPreviewResponse,
  decodeSyncExecutionView
} from "@my-ai-orchestrator/contracts";
import {
  backendAppTestStartedAt,
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices,
  registerLegacyFreeTierPlan,
  seedExecutionVoiceState
} from "./backend-app.fixtures.js";
import { createExecutionApp } from "./backend-app-executions.shared.js";

describe("backend app execution quotes and telemetry", () => {
  it("rejects /me generation when the stored subscription does not allow the quality mode", async () => {
    const config = createBackendAppTestConfig({
      billingUserId: "user_1",
      executionMode: "sync"
    });
    const services = createBackendAppTestServices(config);
    registerLegacyFreeTierPlan(services);
    services.billing.upsertSubscription({
      id: "sub_user_1_free",
      userId: "user_1",
      planId: "free",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });
    await Effect.runPromise(
      services.billing.startCycle({
        userId: "user_1",
        planId: "free",
        cycleId: "user_1:free:cycle:test",
        idempotencyKey: "test:user_1:free:cycle"
      })
    );
    seedExecutionVoiceState(services, "user_1");
    const app = createBackendAppTestApp(config, services);
    const previewPayload = {
      rhetoricalMode: "expound",
      scope: { lengthTier: "long" },
      qualityMode: "balanced",
      briefing: {
        topic: "Policy snapshots",
        audience: "platform engineers"
      }
    };

    const previewResponse = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(previewPayload)
    });

    expect(previewResponse.status).toBe(200);
    const preview = await Effect.runPromise(decodeGenerationPreviewResponse(await previewResponse.json()));
    expect(preview.pricingSnapshot.contentType).toBe("long-piece");
    expect(preview.options.qualityModes.find((mode) => mode.id === "balanced")?.blockedReason).toBe(
      "quality_mode_plan_restriction"
    );

    const executionResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rhetoricalMode: "expound",
        scope: { lengthTier: "long" },
        briefing: previewPayload.briefing,
        qualityMode: "balanced",
        quoteId: preview.pricingSnapshot.quoteId
      })
    });

    expect(executionResponse.status).toBe(403);
    const error = await Effect.runPromise(decodeApiErrorResponse(await executionResponse.json()));
    expect(error.code).toBe("usage_restricted");
    expect(error.category).toBe("authorization");
    expect(error.details?.reason).toBe("quality_mode_plan_restriction");
  });

  // Regression: the web client sends neither preview nor run a qualityMode. Preview used to fall
  // back to first-allowed while the run path defaulted to config QUALITY_MODE, so every quote came
  // back stale (409) even though the client echoed the quoteId verbatim.
  it("accepts a quote round-tripped without an explicit quality mode", async () => {
    const { app } = createExecutionApp("sync");
    const briefing = { topic: "Policy snapshots", audience: "platform engineers" };

    const previewResponse = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rhetoricalMode: "promote", scope: { lengthTier: "medium", channel: "email" }, briefing })
    });

    expect(previewResponse.status).toBe(200);
    const preview = await Effect.runPromise(decodeGenerationPreviewResponse(await previewResponse.json()));

    const runResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rhetoricalMode: "promote",
        scope: { lengthTier: "medium", channel: "email" },
        briefing,
        quoteId: preview.pricingSnapshot.quoteId
      })
    });

    expect(runResponse.status).toBe(200);
  });

  it("accepts a matching quote and rejects a stale quote on the /me execution surface", async () => {
    const { app } = createExecutionApp("sync");
    const previewPayload = {
      rhetoricalMode: "promote",
      scope: { lengthTier: "medium", channel: "email" },
      qualityMode: "balanced",
      briefing: {
        topic: "Policy snapshots",
        audience: "platform engineers"
      }
    };

    const previewResponse = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(previewPayload)
    });

    expect(previewResponse.status).toBe(200);
    const preview = await Effect.runPromise(decodeGenerationPreviewResponse(await previewResponse.json()));
    expect(preview.pricingSnapshot.contentType).toBe("edition-piece");

    const successResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rhetoricalMode: previewPayload.rhetoricalMode,
        scope: previewPayload.scope,
        briefing: previewPayload.briefing,
        qualityMode: "balanced",
        quoteId: preview.pricingSnapshot.quoteId
      })
    });

    expect(successResponse.status).toBe(200);
    const decodedSuccess = await Effect.runPromise(decodeSyncExecutionView(await successResponse.json()));
    expect(decodedSuccess.contentType).toBe("edition-piece");

    // Desde a policy 2026-07-20 o preço é por tamanho: trocar o modo não muda a fatura,
    // então não invalida o quote. O que invalida é mexer em algo que move preço — aqui,
    // o tamanho/canal do plano (medium/email = edition-piece, long/blog = long-piece).
    const sameQuoteOtherMode = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rhetoricalMode: previewPayload.rhetoricalMode,
        scope: previewPayload.scope,
        briefing: previewPayload.briefing,
        qualityMode: "strict",
        quoteId: preview.pricingSnapshot.quoteId
      })
    });

    expect(sameQuoteOtherMode.status).toBe(200);

    const staleResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rhetoricalMode: previewPayload.rhetoricalMode,
        scope: { lengthTier: "long", channel: "blog" },
        briefing: previewPayload.briefing,
        qualityMode: "balanced",
        quoteId: preview.pricingSnapshot.quoteId
      })
    });

    expect(staleResponse.status).toBe(409);
    const staleError = await Effect.runPromise(decodeApiErrorResponse(await staleResponse.json()));
    expect(staleError.code).toBe("quote_stale");
    expect(staleError.category).toBe("conflict");
    expect(staleError.message).toContain("Refresh preview");
    expect(staleError.details?.recovery).toBe("refresh_preview");
  });

  it("accepts rhetoricalMode-based preview and execution with matching quote; rejects stale quote", async () => {
    const { app } = createExecutionApp("sync");
    const previewPayload = {
      rhetoricalMode: "expound",
      scope: { lengthTier: "short" },
      qualityMode: "balanced",
      briefing: {
        topic: "Delegating product decisions",
        audience: "product leaders"
      }
    };

    const previewResponse = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(previewPayload)
    });

    expect(previewResponse.status).toBe(200);
    const preview = await Effect.runPromise(decodeGenerationPreviewResponse(await previewResponse.json()));
    expect(preview.pricingSnapshot.contentType).toBe("short-piece");

    const successResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rhetoricalMode: "expound",
        scope: { lengthTier: "short" },
        briefing: previewPayload.briefing,
        qualityMode: "balanced",
        quoteId: preview.pricingSnapshot.quoteId
      })
    });

    expect(successResponse.status).toBe(200);
    const decodedSuccess = await Effect.runPromise(decodeSyncExecutionView(await successResponse.json()));
    expect(decodedSuccess.contentType).toBe("short-piece");

    // lengthTier move o preço (short-piece vs long-piece), então invalida o quote —
    // ao contrário do qualityMode, que é decisão do sistema e não entra na fatura.
    const staleResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rhetoricalMode: "expound",
        scope: { lengthTier: "long" },
        briefing: previewPayload.briefing,
        qualityMode: "balanced",
        quoteId: preview.pricingSnapshot.quoteId
      })
    });

    expect(staleResponse.status).toBe(409);
    const staleError = await Effect.runPromise(decodeApiErrorResponse(await staleResponse.json()));
    expect(staleError.code).toBe("quote_stale");
    expect(staleError.category).toBe("conflict");
    expect(staleError.message).toContain("Refresh preview");
    expect(staleError.details?.recovery).toBe("refresh_preview");
  });

  it("correlates preview recommendation, quoteId and final quality mode in sync telemetry and trace", async () => {
    const config = createBackendAppTestConfig({
      billingUserId: "user_1",
      executionMode: "sync"
    });
    const services = createBackendAppTestServices(config);
    services.billing.upsertSubscription({
      id: "sub_user_1_criador",
      userId: "user_1",
      planId: "criador",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });
    seedExecutionVoiceState(services, "user_1");
    const app = createBackendAppTestApp(config, services);
    const previewPayload = {
      rhetoricalMode: "argue",
      scope: { lengthTier: "medium" },
      qualityMode: "fast",
      briefing: {
        systemContext: "We need immutable policy snapshots, provider fallbacks and auditable preview-to-execution correlation.",
        tradeoffs: ["more explicit contracts", "better tuning data", "less execution drift"],
        decision: "Keep quote and recommendation visible through execution telemetry."
      }
    };

    const previewResponse = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(previewPayload)
    });

    expect(previewResponse.status).toBe(200);
    const preview = await Effect.runPromise(decodeGenerationPreviewResponse(await previewResponse.json()));
    const previewRecommendation =
      preview.recommendation ??
      (() => {
        const recommendedMode = preview.options.qualityModes.find((mode) => mode.recommended && mode.recommendation);
        return recommendedMode?.recommendation
          ? {
              qualityMode: recommendedMode.id,
              reasonCodes: recommendedMode.recommendation.reasonCodes,
              explanation: recommendedMode.recommendation.explanation
            }
          : undefined;
      })();
    expect(previewRecommendation?.qualityMode).toBe("strict");

    const executionResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rhetoricalMode: previewPayload.rhetoricalMode,
        scope: previewPayload.scope,
        briefing: previewPayload.briefing,
        qualityMode: "fast",
        quoteId: preview.pricingSnapshot.quoteId,
        previewRecommendation,
        includeTrace: true
      })
    });

    expect(executionResponse.status).toBe(200);
    const execution = await Effect.runPromise(decodeSyncExecutionView(await executionResponse.json()));
    const trace = execution.trace as { events?: Array<{ type: string; payload?: Record<string, unknown> }> } | undefined;
    const correlationEvent = trace?.events?.find((event) => event.type === "preview-correlation");

    expect(execution.telemetry?.preview).toMatchObject({
      quoteId: preview.pricingSnapshot.quoteId,
      recommendedQualityMode: "strict",
      finalQualityMode: "fast",
      divergedFromRecommendation: true
    });
    expect(execution.telemetry?.pricing?.plannedCreditPrice).toBe(preview.pricingSnapshot.creditPrice);
    expect(execution.telemetry?.providers?.attempts.length).toBeGreaterThan(0);
    expect(correlationEvent?.payload?.quoteId).toBe(preview.pricingSnapshot.quoteId);
    expect(correlationEvent?.payload?.recommendedQualityMode).toBe("strict");
    expect(correlationEvent?.payload?.finalQualityMode).toBe("fast");
  });

  it("keeps preview-confirmed execution aligned with direct execution for minimized runtime input", async () => {
    const { app } = createExecutionApp("sync");
    const sharedPayload = {
      rhetoricalMode: "promote",
      scope: { lengthTier: "medium", channel: "email" },
      qualityMode: "balanced" as const,
      briefing: {
        topic: "Runtime minimization",
        audience: "platform engineers"
      },
      importedContext: "Notas externas em texto puro sobre handoff e sanitization."
    };

    const previewResponse = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sharedPayload)
    });

    expect(previewResponse.status).toBe(200);
    const preview = await Effect.runPromise(decodeGenerationPreviewResponse(await previewResponse.json()));

    const confirmedResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...sharedPayload,
        quoteId: preview.pricingSnapshot.quoteId
      })
    });

    expect(confirmedResponse.status).toBe(200);
    const confirmed = await Effect.runPromise(decodeSyncExecutionView(await confirmedResponse.json()));
    expect(confirmed.content).toContain("provider:gemini:");
    expect(confirmed.pipelineName).toBe("edition-piece");
    expect(confirmed.contentType).toBe("edition-piece");
  });
});
