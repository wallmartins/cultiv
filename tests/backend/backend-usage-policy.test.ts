import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { buildOrchestrationPlan, DEFAULT_ORCHESTRATION_CATALOG } from "@my-ai-orchestrator/orchestrator";
import { createBackendApp } from "../../apps/backend";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import { createBackendAppTestApp, seedExecutionVoiceState } from "./backend-app.fixtures.js";
import { createBackendTestAuthorizationHeader } from "../../apps/backend/src/auth/index.js";

function buildPlanRequest(overrides: Record<string, unknown> = {}) {
  return {
    pipeline: {
      name: "validation-post",
      steps: [
        { name: "research", skill: "research" },
        { name: "draft", skill: "draft" }
      ]
    },
    inputs: {
      briefing: {
        topic: "Authorization checks",
        keyPoints: ["billing", "feature flags", "limits"]
      }
    },
    model: "gpt-4o-mini",
    adapter: "openai",
    idempotencyKey: "usage-policy-check",
    ...overrides
  };
}

function buildPlan(config: BackendConfig, request: ReturnType<typeof buildPlanRequest>) {
  return buildOrchestrationPlan(request, {
    catalog: DEFAULT_ORCHESTRATION_CATALOG,
    executionMode: config.executionMode,
    qualityMode: config.qualityMode,
    defaultLanguage: config.defaultLanguage
  });
}

describe("backend usage policy", () => {
  it("authorizes sync and async runs through the new billing and flag stack", async () => {
    const now = () => new Date("2026-05-11T00:00:00.000Z");
    const syncConfig: BackendConfig = {
      environment: "test",
      executionMode: "sync",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR",
      serviceName: "backend",
      host: "127.0.0.1",
      port: 3000,
      version: "0.1.0",
      billingPlanId: "pro",
      billingUserId: "backend"
    };
    const asyncConfig: BackendConfig = {
      ...syncConfig,
      executionMode: "async"
    };

    const syncServices = Effect.runSync(createBackendProductServices(syncConfig, { now }));
    const asyncServices = Effect.runSync(createBackendProductServices(asyncConfig, { now }));
    const request = buildPlanRequest();
    const syncPlan = buildPlan(syncConfig, request);
    const asyncPlan = buildPlan(asyncConfig, request);

    const syncAuthorization = await Effect.runPromise(
      syncServices.usagePolicy.authorize({
        request,
        plan: syncPlan,
        executionMode: "sync",
        qualityMode: "balanced",
        userId: "backend",
        planId: "pro",
        model: "gpt-4.1",
        adapter: "openai"
      })
    );
    const asyncAuthorization = await Effect.runPromise(
      asyncServices.usagePolicy.authorize({
        request,
        plan: asyncPlan,
        executionMode: "async",
        qualityMode: "balanced",
        userId: "backend",
        planId: "pro",
        model: "gpt-4.1",
        adapter: "openai"
      })
    );

    expect(syncAuthorization.executionMode).toBe("sync");
    expect(syncAuthorization.planId).toBe("pro");
    expect(asyncAuthorization.executionMode).toBe("async");
    expect(asyncAuthorization.planId).toBe("pro");
  });

  it("enforces plan model entitlements and daily traffic limits", async () => {
    const now = () => new Date("2026-05-11T00:00:00.000Z");
    const config: BackendConfig = {
      environment: "test",
      executionMode: "sync",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR",
      serviceName: "backend",
      host: "127.0.0.1",
      port: 3000,
      version: "0.1.0",
      billingPlanId: "free",
      billingUserId: "backend"
    };
    const services = Effect.runSync(createBackendProductServices(config, { now }));
    const request = buildPlanRequest();
    const plan = buildPlan(config, request);

    const disallowedModel = await Effect.runPromise(
      Effect.either(
        services.usagePolicy.authorize({
          request,
          plan,
          executionMode: "sync",
          qualityMode: "balanced",
          userId: "backend",
          planId: "free",
          model: "claude-3-5-sonnet",
          adapter: "openai"
        })
      )
    );

    expect(disallowedModel._tag).toBe("Left");
    expect(disallowedModel.left.reason).toBe("model_not_allowed");

    for (let attempt = 0; attempt < 25; attempt += 1) {
      const allowed = await Effect.runPromise(
        services.usagePolicy.authorize({
          request: {
            ...request,
            idempotencyKey: `traffic-${attempt}`
          },
          plan,
          executionMode: "sync",
          qualityMode: "balanced",
          userId: "backend",
          planId: "free",
          model: "gpt-4o-mini",
          adapter: "openai"
        })
      );
      expect(allowed.trafficUsed).toBe(attempt + 1);
      expect(allowed.trafficLimit).toBe(25);
    }

    const blockedByTraffic = await Effect.runPromise(
      Effect.either(
        services.usagePolicy.authorize({
          request: {
            ...request,
            idempotencyKey: "traffic-limit-hit"
          },
          plan,
          executionMode: "sync",
          qualityMode: "balanced",
          userId: "backend",
          planId: "free",
          model: "gpt-4o-mini",
          adapter: "openai"
        })
      )
    );

    expect(blockedByTraffic._tag).toBe("Left");
    expect(blockedByTraffic.left.reason).toBe("traffic_limit");
  });

  it("gates refinement by feature flags and plan entitlement in the new backend", async () => {
    const now = () => new Date("2026-05-11T00:00:00.000Z");
    const freeConfig: BackendConfig = {
      environment: "test",
      executionMode: "sync",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR",
      serviceName: "backend",
      host: "127.0.0.1",
      port: 3000,
      version: "0.1.0",
      billingPlanId: "free",
      billingUserId: "backend"
    };
    const proConfig: BackendConfig = {
      ...freeConfig,
      billingPlanId: "pro"
    };

    const freeServices = Effect.runSync(createBackendProductServices(freeConfig, { now }));
    const proServices = Effect.runSync(createBackendProductServices(proConfig, { now }));
    const request = buildPlanRequest();
    const freePlan = buildPlan(freeConfig, request);
    const proPlan = buildPlan(proConfig, request);

    const freeAuthorization = await Effect.runPromise(
      freeServices.usagePolicy.authorize({
        request,
        plan: freePlan,
        executionMode: "sync",
        qualityMode: "balanced",
        userId: "backend",
        planId: "free",
        model: "gpt-4o-mini",
        adapter: "openai"
      })
    );
    const proAuthorization = await Effect.runPromise(
      proServices.usagePolicy.authorize({
        request: {
          ...request,
          idempotencyKey: "usage-policy-check-pro"
        },
        plan: proPlan,
        executionMode: "sync",
        qualityMode: "balanced",
        userId: "backend",
        planId: "pro",
        model: "gpt-4.1",
        adapter: "openai"
      })
    );

    expect(freeServices.featureFlags.isEnabled("content.language.refinement", {
      environment: "test",
      contentType: freePlan.contentType.id,
      userId: "backend"
    })).toBe(true);
    expect(freeAuthorization.refinementEnabled).toBe(false);
    expect(proAuthorization.refinementEnabled).toBe(true);
  });

  it("returns authorization failures through the backend HTTP boundary", async () => {
    const now = () => new Date("2026-05-11T00:00:00.000Z");
    const config: BackendConfig = {
      environment: "test",
      executionMode: "sync",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR",
      serviceName: "backend",
      host: "127.0.0.1",
      port: 3000,
      version: "0.1.0",
      billingPlanId: "free",
      billingUserId: "backend"
    };
    const services = Effect.runSync(createBackendProductServices(config, { now }));
    seedExecutionVoiceState(services, "backend");
    const app = createBackendAppTestApp(
      createBackendApp(config, {
      startedAt: now(),
      now,
      services
      }),
      services
    );

    const response = await app.request("/me/executions/run", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: createBackendTestAuthorizationHeader({ userId: "backend" })
      },
      body: JSON.stringify({
        contentType: "linkedin-post",
        qualityMode: "fast",
        briefing: {
          topic: "Authorization checks",
          keyPoints: ["billing", "feature flags", "limits"]
        },
        model: "claude-3-5-sonnet",
        idempotencyKey: "http-authorization-failure-me"
      })
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("usage_restricted");
    expect(body.category).toBe("authorization");
    expect(body.details.reason).toBe("model_not_allowed");
  });
});
