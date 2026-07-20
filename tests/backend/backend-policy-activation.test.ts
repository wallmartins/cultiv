import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createDatabase } from "../../packages/database";
import {
  createBackendProductServices,
  type BackendConfig
} from "../../apps/backend";
import {
  backendAppTestNow,
  backendAppTestStartedAt,
  createBackendAppTestApp,
  createBackendAppTestConfig,
  seedExecutionVoiceState
} from "./backend-app.fixtures.js";
import { decodeApiErrorResponse, decodeGenerationPreviewResponse } from "@my-ai-orchestrator/contracts";

describe("backend policy activation", () => {
  it("guards internal policy routes by authenticated actor permission", async () => {
    const config = createBackendAppTestConfig({
      billingUserId: "user_1",
      billingPlanId: "pro"
    });
    const services = Effect.runSync(createBackendProductServices(config, { now: () => backendAppTestStartedAt }));
    seedExecutionVoiceState(services, "user_1");
    const app = createBackendAppTestApp(config, services);

    const unauthenticatedResponse = await app.request("/api/internal/policies");
    expect(unauthenticatedResponse.status).toBe(401);

    const unauthenticatedError = await Effect.runPromise(
      decodeApiErrorResponse(await unauthenticatedResponse.json())
    );
    expect(unauthenticatedError.code).toBe("authentication_missing_token");

    const unauthorizedResponse = await app.request("/api/internal/policies", {
      headers: {
        "x-backend-user-id": "operator_1"
      }
    });
    expect(unauthorizedResponse.status).toBe(403);

    const unauthorizedError = await Effect.runPromise(
      decodeApiErrorResponse(await unauthorizedResponse.json())
    );
    expect(unauthorizedError.code).toBe("authorization_insufficient_permission");
    expect(unauthorizedError.category).toBe("authorization");
    expect(unauthorizedError.details?.requiredPermission).toBe("ai_policy.activate");
  });

  it("lists, activates, and audits the active policy version through the internal route", async () => {
    const config = createBackendAppTestConfig({
      billingUserId: "user_1",
      billingPlanId: "pro"
    });
    const services = Effect.runSync(createBackendProductServices(config, { now: () => backendAppTestStartedAt }));
    seedExecutionVoiceState(services, "user_1");
    const app = createBackendAppTestApp(config, services);
    const operatorHeaders = {
      "content-type": "application/json",
      "x-backend-user-id": "operator_1",
      "x-backend-permissions": "ai_policy.activate"
    };

    const listResponse = await app.request("/api/internal/policies", {
      headers: operatorHeaders
    });
    expect(listResponse.status).toBe(200);
    const listed = await listResponse.json() as {
      availableVersions: Array<{ version: string }>;
      activePointer: { activePolicyVersion: string };
    };
    expect(listed.activePointer.activePolicyVersion).toBe("2026-07-20");
    expect(listed.availableVersions.map((version) => version.version)).toContain("2026-05-16");

    const activateResponse = await app.request("/api/internal/policies/activate", {
      method: "POST",
      headers: operatorHeaders,
      body: JSON.stringify({
        policyVersion: "2026-04-01"
      })
    });
    expect(activateResponse.status).toBe(200);
    const activated = await activateResponse.json() as {
      activePointer: {
        activePolicyVersion: string;
        updatedBy: string;
        history: Array<{ policyVersion: string; updatedBy: string }>;
      };
    };
    expect(activated.activePointer.activePolicyVersion).toBe("2026-04-01");
    expect(activated.activePointer.updatedBy).toBe("operator_1");
    expect(activated.activePointer.history.at(-1)).toMatchObject({
      policyVersion: "2026-04-01",
      updatedBy: "operator_1"
    });
  });

  it("rejects stale preview quotes after policy activation changes the active version", async () => {
    const config = createBackendAppTestConfig({
      billingUserId: "user_1",
      billingPlanId: "criador",
      executionMode: "sync"
    });
    const services = Effect.runSync(createBackendProductServices(config, { now: () => backendAppTestStartedAt }));
    services.billing.upsertSubscription({
      id: "sub_user_1_criador",
      userId: "user_1",
      planId: "criador",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });
    seedExecutionVoiceState(services, "user_1");
    const app = createBackendAppTestApp(config, services);

    const previewResponse = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contentType: "newsletter",
        qualityMode: "balanced",
        briefing: {
          topic: "Policy activation safety"
        }
      })
    });

    expect(previewResponse.status).toBe(200);
    const preview = await Effect.runPromise(decodeGenerationPreviewResponse(await previewResponse.json()));
    expect(preview.pricingSnapshot.policyVersion).toBe("2026-07-20");

    const activateResponse = await app.request("/api/internal/policies/activate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-backend-user-id": "operator_1",
        "x-backend-permissions": "ai_policy.activate"
      },
      body: JSON.stringify({
        policyVersion: "2026-04-01"
      })
    });
    expect(activateResponse.status).toBe(200);

    const staleResponse = await app.request("/me/executions/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contentType: "newsletter",
        qualityMode: "balanced",
        briefing: {
          topic: "Policy activation safety"
        },
        quoteId: preview.pricingSnapshot.quoteId
      })
    });

    expect(staleResponse.status).toBe(409);
    const staleError = await Effect.runPromise(decodeApiErrorResponse(await staleResponse.json()));
    expect(staleError.code).toBe("quote_stale");
    expect(staleError.category).toBe("conflict");
    expect(staleError.details?.recovery).toBe("refresh_preview");
  });

  it("converges active policy reload across instances while older snapshots stay pinned", () => {
    const sharedDatabase = createDatabase();
    const clock = {
      current: new Date("2026-05-11T00:00:00.000Z")
    };
    const now = () => new Date(clock.current);
    const config: BackendConfig = createBackendAppTestConfig({
      billingUserId: "user_1",
      billingPlanId: "pro",
      aiPolicyReloadIntervalMs: 1000
    });

    const servicesA = Effect.runSync(createBackendProductServices(config, { now, database: sharedDatabase }));
    const servicesB = Effect.runSync(createBackendProductServices(config, { now, database: sharedDatabase }));

    const snapshotBeforeActivation = Effect.runSync(
      servicesB.aiPolicy.resolveExecutionSnapshot({
        request: {
          userId: "user_1",
          pipelineType: "newsletter",
          contentType: "newsletter",
          briefing: { topic: "Pinned snapshot" },
          qualityMode: "balanced"
        },
        planTier: "pro",
        executionMode: "sync",
        qualityMode: "balanced",
        defaultLanguage: "pt-BR"
      })
    );
    expect(snapshotBeforeActivation.policyVersion).toBe("2026-07-20");

    Effect.runSync(
      servicesA.aiPolicy.activatePolicyVersion({
        policyVersion: "2026-04-01",
        actor: "operator_1",
        approvedAt: backendAppTestStartedAt.toISOString()
      })
    );

    const stillCachedPolicy = Effect.runSync(servicesB.aiPolicy.getActivePolicy());
    expect(stillCachedPolicy.version).toBe("2026-07-20");

    clock.current = new Date(backendAppTestNow.getTime() + 2_000);
    const reloadedPolicy = Effect.runSync(servicesB.aiPolicy.getActivePolicy());
    expect(reloadedPolicy.version).toBe("2026-04-01");
    expect(snapshotBeforeActivation.policyVersion).toBe("2026-07-20");
  });

  it("recommends a future policy version from degradation signals without auto-activating it", () => {
    const sharedDatabase = createDatabase();
    const config = createBackendAppTestConfig({
      billingUserId: "user_1",
      billingPlanId: "pro"
    });
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => backendAppTestStartedAt,
        database: sharedDatabase
      })
    );

    Effect.runSync(
      services.aiPolicy.recordDegradationSignal({
        policyVersion: "2026-07-20",
        provider: "openai",
        occurredAt: backendAppTestStartedAt.toISOString(),
        failureCount: 3
      })
    );

    const recommendation = Effect.runSync(services.aiPolicy.recommendFuturePolicyVersion());
    const activePointer = Effect.runSync(services.aiPolicy.getActivePolicyPointer());

    expect(recommendation?.recommendedPolicyVersion).toBe("2026-06-22");
    expect(activePointer.activePolicyVersion).toBe("2026-07-20");
  });
});
