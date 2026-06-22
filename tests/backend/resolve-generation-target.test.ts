import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { BackendValidationError } from "../../apps/backend/src/http/errors.js";
import { resolveGenerationTarget } from "../../apps/backend/src/product/generation/resolve-generation-target.js";

describe("resolveGenerationTarget", () => {
  it("resolves intent and scope to legacy content type with metadata", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        intent: "share-idea",
        scope: { lengthTier: "short" }
      })
    );

    expect(resolved.contentTypeId).toBe("linkedin-post");
    expect(resolved.resolvedIntent).toMatchObject({
      intent: "share-idea",
      legacyContentTypeId: "linkedin-post",
      wordTarget: { min: 150, max: 400 },
      channelHint: "unspecified"
    });
  });

  it("resolves legacy contentType-only requests without resolvedIntent", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        contentType: "newsletter"
      })
    );

    expect(resolved).toEqual({ contentTypeId: "newsletter" });
  });

  it("fails when neither intent+scope nor contentType is provided", async () => {
    const result = await Effect.runPromise(Effect.either(resolveGenerationTarget({})));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(BackendValidationError);
      expect(result.left.message).toContain("Either intent and scope or contentType");
    }
  });

  it("fails when intent is provided without scope", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        resolveGenerationTarget({
          intent: "share-idea"
        })
      )
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(BackendValidationError);
    }
  });

  it("prefers intent resolution and records ignored legacy contentType when both are present", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        intent: "share-idea",
        scope: { lengthTier: "short" },
        contentType: "newsletter"
      })
    );

    expect(resolved.contentTypeId).toBe("linkedin-post");
    expect(resolved.ignoredLegacyContentType).toBe("newsletter");
  });
});
