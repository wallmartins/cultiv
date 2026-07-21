import { Effect } from "effect";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  decodeApiErrorResponse,
  decodeSyncExecutionView
} from "@my-ai-orchestrator/contracts";
import {
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices,
  seedExecutionVoiceState
} from "./backend-app.fixtures.js";

describe("backend app experimental executions", () => {
  it("guards the experimental pipeline route by role and feature flag", async () => {
    const config = createBackendAppTestConfig({
      executionMode: "sync",
      experimentalDebugEnabled: false
    });
    const services = createBackendAppTestServices(config);
    seedExecutionVoiceState(services, "user_1");
    const app = createBackendAppTestApp(config, services);
    const requestBody = {
      pipeline: {
        name: "short-piece",
        steps: [
          { name: "analyze", skill: "analyze" },
          { name: "draft", skill: "draft" },
          { name: "refine", skill: "refine" }
        ]
      },
      inputs: {
        briefing: {
          topic: "Experimental pipeline"
        }
      },
      qualityMode: "balanced",
      includeTrace: true
    };

    const missingRoleResponse = await app.request("/api/internal/experimental/run", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-backend-user-id": "operator_1"
      },
      body: JSON.stringify(requestBody)
    });

    expect(missingRoleResponse.status).toBe(403);
    const missingRoleError = await Effect.runPromise(decodeApiErrorResponse(await missingRoleResponse.json()));
    expect(missingRoleError.code).toBe("usage_restricted");
    expect(missingRoleError.details?.reason).toBe("missing_role");

    const flagDisabledResponse = await app.request("/api/internal/experimental/run", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-backend-user-id": "operator_staff_disabled",
        "x-backend-role": "staff"
      },
      body: JSON.stringify(requestBody)
    });

    expect(flagDisabledResponse.status).toBe(403);
    const flagDisabledError = await Effect.runPromise(decodeApiErrorResponse(await flagDisabledResponse.json()));
    expect(flagDisabledError.code).toBe("usage_restricted");
    expect(flagDisabledError.details?.reason).toBe("feature_disabled");
  });

  it("runs the guarded experimental pipeline flow with simulated credits and normal telemetry", async () => {
    const config = createBackendAppTestConfig({
      billingUserId: "user_1",
      billingPlanId: "pro",
      executionMode: "sync",
      experimentalDebugEnabled: true,
      experimentalAIPolicyManifestPath: resolve(process.cwd(), "apps/backend/policies/experimental/manifest.json")
    });
    const services = createBackendAppTestServices(config);
    seedExecutionVoiceState(services, "user_1");
    const app = createBackendAppTestApp(config, services);

    const response = await app.request("/api/internal/experimental/run", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-backend-user-id": "operator_staff_enabled",
        "x-backend-role": "staff"
      },
      body: JSON.stringify({
        pipeline: {
          name: "short-piece",
          steps: [
            { name: "analyze", skill: "analyze" },
            { name: "draft", skill: "draft" },
            { name: "refine", skill: "refine" },
            { name: "sanitize", skill: "sanitize" }
          ]
        },
        inputs: {
          briefing: {
            topic: "Guarded experimentation",
            keyPoints: ["separate catalog", "simulated credits", "provider telemetry"]
          }
        },
        qualityMode: "balanced",
        includeTrace: true,
        idempotencyKey: "experimental-debug-flow"
      })
    });

    expect(response.status).toBe(200);
    const execution = await Effect.runPromise(decodeSyncExecutionView(await response.json()));

    expect(execution.pipelineName).toBe("short-piece");
    expect(execution.telemetry?.pricing).toMatchObject({
      policyVersion: "2026-05-24-exp",
      contentType: "short-piece",
      plannedCreditPrice: 2.8
    });
    expect(execution.telemetry?.billing).toBeUndefined();
    expect(execution.telemetry?.providers?.finalProvider).toBe("anthropic");
    expect(execution.telemetry?.providers?.attempts.length).toBeGreaterThan(0);
    expect(execution.telemetry?.cost?.estimatedUsdCost).toBeGreaterThan(0);
    expect(execution.telemetry?.pricing?.observedDebitedCredits).toBeGreaterThan(0);
  });
});
