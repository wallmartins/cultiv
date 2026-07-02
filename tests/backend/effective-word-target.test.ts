import { describe, expect, it } from "vitest";
import {
  resolveEffectiveWordTarget,
  resolveOutputWordTargetForFormatName,
  toIntentWordTarget
} from "../../packages/text-quality/src/format/word-targets.js";
import { resolveGenerationIntent } from "../../apps/backend/src/product/generation/intent-resolver.js";
import { resolveOutputWordTarget } from "../../packages/text-quality/src/format/output-length.js";

describe("resolveEffectiveWordTarget", () => {
  it("keeps linkedin medium in feed range instead of 400-1200", () => {
    const target = resolveEffectiveWordTarget({
      contentType: "linkedin-post",
      lengthTier: "medium",
      channel: "professional-network"
    });

    expect(target.maxWords).toBeLessThanOrEqual(300);
    expect(target.minWords).toBeGreaterThanOrEqual(130);
    expect(target.idealWords).toBeLessThanOrEqual(220);
  });

  it("allows blog long to stay in long-form range", () => {
    const target = resolveEffectiveWordTarget({
      contentType: "long-form-blog",
      lengthTier: "long",
      channel: "blog"
    });

    expect(target.minWords).toBeGreaterThanOrEqual(1200);
    expect(target.maxWords).toBeLessThanOrEqual(2500);
  });

  it("resolves intent word targets from content type and channel", () => {
    const resolved = resolveGenerationIntent({
      intent: "engage-audience",
      scope: { lengthTier: "medium", channel: "professional-network" }
    });

    expect(resolved.legacyContentTypeId).toBe("linkedin-post");
    expect(resolved.wordTarget.max).toBeLessThanOrEqual(300);
    expect(resolved.wordTarget.min).toBeGreaterThanOrEqual(130);
  });

  it("uses explicit context wordTarget for quality scoring", () => {
    const target = resolveOutputWordTarget({
      pipeline: { name: "linkedin-post" },
      context: {
        wordTarget: { min: 170, max: 260 },
        lengthTier: "medium",
        generationChannel: "professional-network"
      }
    });

    expect(target.minWords).toBe(170);
    expect(target.maxWords).toBe(260);
  });

  it("matches format and effective ideal for linkedin baseline", () => {
    const format = resolveOutputWordTargetForFormatName("linkedin-post");
    const effective = resolveEffectiveWordTarget({
      contentType: "linkedin-post",
      lengthTier: "short",
      channel: "professional-network"
    });

    expect(toIntentWordTarget(effective).max).toBeLessThanOrEqual(format.maxWords);
  });
});
