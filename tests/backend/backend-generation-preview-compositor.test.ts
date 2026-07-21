import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { decodeGenerationPreviewResponse } from "@my-ai-orchestrator/contracts";
import {
  backendAppTestStartedAt,
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices
} from "./backend-app.fixtures.js";

// generation-preview always resolves through the compositor now (Practice Profile Phase 1
// clean cut removed the legacy/compositorV1Enabled branch); `compositorV1Enabled` on BackendConfig
// is a vestigial feature-flag registration that nothing in the generation path reads anymore.
describe("backend generation preview compositor", () => {
  it("returns compositor planSignature and expression profile when compositorV1Enabled is true", async () => {
    const config = createBackendAppTestConfig({
      billingUserId: "user_compositor_preview",
      compositorV1Enabled: true
    });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_compositor_preview_pro",
      userId: "user_compositor_preview",
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
        scope: { lengthTier: "medium", channel: "email" },
        briefing: {
          topic: "Why compositor planning matters"
        }
      })
    });

    expect(response.status).toBe(200);

    const decoded = await Effect.runPromise(decodeGenerationPreviewResponse(await response.json()));

    expect(decoded.compositor?.planSignature).toBe("edition-piece");
    expect(decoded.compositor?.expressionProfile).toBe("email-expound");
    expect(decoded.pricingSnapshot.contentType).toBe("edition-piece");
  });

  it("still resolves through the compositor when compositorV1Enabled is false (flag is inert)", async () => {
    const config = createBackendAppTestConfig({
      billingUserId: "user_legacy_preview",
      compositorV1Enabled: false
    });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_legacy_preview_pro",
      userId: "user_legacy_preview",
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
        scope: { lengthTier: "medium", channel: "email" },
        briefing: {
          topic: "Legacy resolver path"
        }
      })
    });

    expect(response.status).toBe(200);

    const decoded = await Effect.runPromise(decodeGenerationPreviewResponse(await response.json()));

    expect(decoded.compositor?.planSignature).toBe("edition-piece");
    expect(decoded.pricingSnapshot.contentType).toBe("edition-piece");
  });
});
