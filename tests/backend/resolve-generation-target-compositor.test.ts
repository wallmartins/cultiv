import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { resolveGenerationTarget } from "../../apps/backend/src/product/generation/resolve-generation-target.js";

describe("resolveGenerationTarget compositor", () => {
  it("returns compositor plan when compositorEnabled is true", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        intent: "share-idea",
        scope: { lengthTier: "medium", channel: "email" },
        compositorEnabled: true,
        qualityMode: "balanced"
      })
    );

    expect(resolved.contentTypeId).toBe("edition-piece");
    expect(resolved.resolvedIntent).toMatchObject({
      intent: "share-idea",
      legacyContentTypeId: "linkedin-post",
      channelHint: "email"
    });
    expect(resolved.compositor?.plan.planSignature).toBe("edition-piece");
    expect(resolved.compositor?.plan.parameters.expressionProfile).toBe("email-share-idea");
    expect(resolved.compositor?.pipeline.name).toBe("edition-piece");
    expect(resolved.compositor?.pipeline.steps.at(-1)?.skill).toBe("sanitize");
  });

  it("keeps legacy resolution when compositorEnabled is false", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        intent: "share-idea",
        scope: { lengthTier: "medium", channel: "email" },
        compositorEnabled: false
      })
    );

    expect(resolved.contentTypeId).toBe("linkedin-post");
    expect(resolved.compositor).toBeUndefined();
  });

  it("defaults to legacy resolution when compositorEnabled is omitted", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        intent: "share-idea",
        scope: { lengthTier: "short" }
      })
    );

    expect(resolved.contentTypeId).toBe("linkedin-post");
    expect(resolved.compositor).toBeUndefined();
  });

  it("records ignored legacy contentType when compositor is enabled", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        intent: "share-idea",
        scope: { lengthTier: "medium", channel: "email" },
        contentType: "newsletter",
        compositorEnabled: true
      })
    );

    expect(resolved.contentTypeId).toBe("edition-piece");
    expect(resolved.ignoredLegacyContentType).toBe("newsletter");
    expect(resolved.compositor?.plan.planSignature).toBe("edition-piece");
  });
});
