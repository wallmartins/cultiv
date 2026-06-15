import { describe, expect, it } from "vitest";
import { createBackendApp } from "../../apps/backend";
import { createBackendTestAuthorizationHeader } from "../../apps/backend/src/auth/index.js";
import {
  backendAppTestStartedAt,
  createBackendAppTestConfig,
  createBackendAppTestServices
} from "./backend-app.fixtures.js";

describe("dev showcase billing activation", () => {
  it("activates billing for the authenticated user in development", async () => {
    const config = createBackendAppTestConfig({
      environment: "development",
      billingPlanId: "pro"
    });
    const services = createBackendAppTestServices(config);
    const app = createBackendApp(config, {
      startedAt: backendAppTestStartedAt,
      now: () => backendAppTestStartedAt,
      services
    });

    const userId = "showcase-cultiv-hitl";
    const authorization = createBackendTestAuthorizationHeader({ userId, subject: userId });

    const response = await app.request("/dev/showcase/billing-activate", {
      method: "POST",
      headers: { authorization }
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.planId).toBe("pro");
    expect(body.active).toBe(true);
    expect(body.availableCredits).toBeGreaterThan(0);

    const entitlement = services.billing.getEntitlement(body.userId, "pro");
    expect(entitlement?.canGenerate).toBe(true);
  });

  it("is not available outside development", async () => {
    const config = createBackendAppTestConfig({
      environment: "test",
      billingPlanId: "pro"
    });
    const services = createBackendAppTestServices(config);
    const app = createBackendApp(config, {
      startedAt: backendAppTestStartedAt,
      now: () => backendAppTestStartedAt,
      services
    });

    const response = await app.request("/dev/showcase/billing-activate", {
      method: "POST",
      headers: {
        authorization: createBackendTestAuthorizationHeader({ userId: "user_1" })
      }
    });

    expect(response.status).toBe(404);
  });
});
