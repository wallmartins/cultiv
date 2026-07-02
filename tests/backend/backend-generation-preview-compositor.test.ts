import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { decodeGenerationPreviewResponse, resolvePhase1LegacyContentTypeId } from "@my-ai-orchestrator/contracts";
import { resolveEffectiveWordTarget, toIntentWordTarget } from "@my-ai-orchestrator/text-quality";
import {
  backendAppTestStartedAt,
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices
} from "./backend-app.fixtures.js";

describe("backend generation preview compositor", () => {
  it("returns compositor planSignature when compositor flag is enabled", async () => {
    const config = createBackendAppTestConfig({
      billingUserId: "user_compositor_preview",
      compositorV1Enabled: true
    });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_compositor_preview_pro",
      userId: "user_compositor_preview",
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
        scope: { lengthTier: "medium", channel: "email" },
        briefing: {
          topic: "Why compositor planning matters"
        }
      })
    });

    expect(response.status).toBe(200);

    const decoded = await Effect.runPromise(decodeGenerationPreviewResponse(await response.json()));

    expect(decoded.compositor?.planSignature).toBe("edition-piece");
    expect(decoded.compositor?.expressionProfile).toBe("email-share-idea");
    expect(decoded.pricingSnapshot.contentType).toBe("edition-piece");
    const wordTarget = toIntentWordTarget(
      resolveEffectiveWordTarget({
        contentType: resolvePhase1LegacyContentTypeId("share-idea", "medium"),
        lengthTier: "medium",
        channel: "email"
      })
    );

    expect(decoded.resolvedIntent).toMatchObject({
      intent: "share-idea",
      scope: { lengthTier: "medium", channel: "email" },
      wordTargetMin: wordTarget.min,
      wordTargetMax: wordTarget.max
    });
  });

  it("keeps legacy preview behavior when compositor flag is disabled", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_legacy_preview" });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_legacy_preview_pro",
      userId: "user_legacy_preview",
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
        scope: { lengthTier: "medium", channel: "email" },
        briefing: {
          topic: "Legacy resolver path"
        }
      })
    });

    expect(response.status).toBe(200);

    const decoded = await Effect.runPromise(decodeGenerationPreviewResponse(await response.json()));

    expect(decoded.compositor).toBeUndefined();
    expect(decoded.pricingSnapshot.contentType).toBe("linkedin-post");
  });
});
