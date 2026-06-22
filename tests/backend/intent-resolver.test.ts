import { describe, expect, it } from "vitest";
import type { GenerationIntent, GenerationLengthTier } from "@my-ai-orchestrator/contracts";
import {
  defaultLengthTierForIntent,
  resolveGenerationIntent
} from "../../apps/backend/src/product/generation/intent-resolver.js";

const WORD_TARGETS: Record<GenerationLengthTier, { min: number; max: number }> = {
  short: { min: 150, max: 400 },
  medium: { min: 400, max: 1200 },
  long: { min: 1200, max: 3500 }
};

const PHASE1_LEGACY_MAPPINGS: ReadonlyArray<{
  readonly intent: GenerationIntent;
  readonly lengthTier: GenerationLengthTier;
  readonly legacyContentTypeId: string;
}> = [
  { intent: "share-idea", lengthTier: "short", legacyContentTypeId: "linkedin-post" },
  { intent: "share-idea", lengthTier: "medium", legacyContentTypeId: "linkedin-post" },
  { intent: "share-idea", lengthTier: "long", legacyContentTypeId: "long-form-blog" },
  { intent: "explain-deeply", lengthTier: "short", legacyContentTypeId: "validation-post" },
  { intent: "explain-deeply", lengthTier: "medium", legacyContentTypeId: "architecture-post" },
  { intent: "explain-deeply", lengthTier: "long", legacyContentTypeId: "long-form-blog" },
  { intent: "engage-audience", lengthTier: "short", legacyContentTypeId: "validation-post" },
  { intent: "engage-audience", lengthTier: "medium", legacyContentTypeId: "linkedin-post" },
  { intent: "engage-audience", lengthTier: "long", legacyContentTypeId: "newsletter" },
  { intent: "tell-story", lengthTier: "short", legacyContentTypeId: "twitter-thread" },
  { intent: "tell-story", lengthTier: "medium", legacyContentTypeId: "twitter-thread" },
  { intent: "tell-story", lengthTier: "long", legacyContentTypeId: "long-form-blog" },
  { intent: "update-subscribers", lengthTier: "short", legacyContentTypeId: "linkedin-post" },
  { intent: "update-subscribers", lengthTier: "medium", legacyContentTypeId: "newsletter" },
  { intent: "update-subscribers", lengthTier: "long", legacyContentTypeId: "newsletter" },
  { intent: "document-decision", lengthTier: "short", legacyContentTypeId: "validation-post" },
  { intent: "document-decision", lengthTier: "medium", legacyContentTypeId: "architecture-post" },
  { intent: "document-decision", lengthTier: "long", legacyContentTypeId: "architecture-post" }
];

describe("resolveGenerationIntent", () => {
  it.each(PHASE1_LEGACY_MAPPINGS)(
    "maps $intent + $lengthTier to $legacyContentTypeId with matching word target",
    ({ intent, lengthTier, legacyContentTypeId }) => {
      const resolved = resolveGenerationIntent({
        intent,
        scope: { lengthTier }
      });

      expect(resolved.legacyContentTypeId).toBe(legacyContentTypeId);
      expect(resolved.wordTarget).toEqual(WORD_TARGETS[lengthTier]);
      expect(resolved.intent).toBe(intent);
      expect(resolved.scope.lengthTier).toBe(lengthTier);
    }
  );

  it("maps engage-audience long to newsletter", () => {
    const resolved = resolveGenerationIntent({
      intent: "engage-audience",
      scope: { lengthTier: "long" }
    });

    expect(resolved.legacyContentTypeId).toBe("newsletter");
    expect(resolved.wordTarget).toEqual({ min: 1200, max: 3500 });
  });

  it("defaults channel to unspecified when omitted", () => {
    const resolved = resolveGenerationIntent({
      intent: "tell-story",
      scope: { lengthTier: "medium" }
    });

    expect(resolved.channelHint).toBe("unspecified");
  });

  it("preserves an explicit channel hint without changing legacy mapping", () => {
    const resolved = resolveGenerationIntent({
      intent: "share-idea",
      scope: { lengthTier: "short", channel: "professional-network" }
    });

    expect(resolved.channelHint).toBe("professional-network");
    expect(resolved.legacyContentTypeId).toBe("linkedin-post");
  });
});

describe("defaultLengthTierForIntent", () => {
  it.each([
    ["share-idea", "short"],
    ["explain-deeply", "long"],
    ["engage-audience", "short"],
    ["tell-story", "medium"],
    ["update-subscribers", "long"],
    ["document-decision", "medium"]
  ] as const)("defaults %s to %s", (intent, lengthTier) => {
    expect(defaultLengthTierForIntent(intent)).toBe(lengthTier);
  });
});
