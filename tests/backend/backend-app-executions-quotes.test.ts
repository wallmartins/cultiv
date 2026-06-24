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
      contentType: "architecture-post",
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
    expect(preview.options.contentTypes.find((contentType) => contentType.id === "architecture-post")?.allowed).toBe(true);
    expect(preview.options.qualityModes.find((mode) => mode.id === "balanced")?.blockedReason).toBe(
      "quality_mode_plan_restriction"
    );

    const executionResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contentType: "architecture-post",
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

  it("accepts a matching quote and rejects a stale quote on the /me execution surface", async () => {
    const { app, services } = createExecutionApp("sync");
    services.billing.upsertSubscription({
      id: "sub_user_1_pro",
      userId: "user_1",
      planId: "pro",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });
    const previewPayload = {
      contentType: "newsletter",
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

    const successResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contentType: "newsletter",
        briefing: previewPayload.briefing,
        qualityMode: "balanced",
        quoteId: preview.pricingSnapshot.quoteId
      })
    });

    expect(successResponse.status).toBe(200);
    const decodedSuccess = await Effect.runPromise(decodeSyncExecutionView(await successResponse.json()));
    expect(decodedSuccess.contentType).toBe("newsletter");

    const staleResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contentType: "newsletter",
        briefing: previewPayload.briefing,
        qualityMode: "strict",
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

  it("accepts intent-based preview and execution with matching quote; rejects stale quote", async () => {
    const { app, services } = createExecutionApp("sync");
    services.billing.upsertSubscription({
      id: "sub_user_1_pro",
      userId: "user_1",
      planId: "pro",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });
    const previewPayload = {
      intent: "share-idea",
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
    expect(preview.pricingSnapshot.contentType).toBe("linkedin-post");

    const successResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        intent: "share-idea",
        scope: { lengthTier: "short" },
        briefing: previewPayload.briefing,
        qualityMode: "balanced",
        quoteId: preview.pricingSnapshot.quoteId
      })
    });

    expect(successResponse.status).toBe(200);
    const decodedSuccess = await Effect.runPromise(decodeSyncExecutionView(await successResponse.json()));
    expect(decodedSuccess.contentType).toBe("linkedin-post");

    const staleResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        intent: "share-idea",
        scope: { lengthTier: "short" },
        briefing: previewPayload.briefing,
        qualityMode: "strict",
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
      id: "sub_user_1_pro",
      userId: "user_1",
      planId: "pro",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });
    seedExecutionVoiceState(services, "user_1");
    const app = createBackendAppTestApp(config, services);
    const previewPayload = {
      contentType: "architecture-post",
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
        contentType: "architecture-post",
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
    const { app, services } = createExecutionApp("sync");
    services.billing.upsertSubscription({
      id: "sub_user_1_pro",
      userId: "user_1",
      planId: "pro",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });
    const sharedPayload = {
      contentType: "newsletter",
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
    expect(confirmed.pipelineName).toBe("newsletter");
    expect(confirmed.contentType).toBe("newsletter");
  });
});
