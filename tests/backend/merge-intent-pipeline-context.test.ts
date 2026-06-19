import { describe, expect, it } from "vitest";
import { mergeIntentPipelineContext } from "../../apps/backend/src/product/generation/merge-intent-pipeline-context.js";

describe("mergeIntentPipelineContext", () => {
  it("merges wordTarget and intent metadata into pipeline context", () => {
    const merged = mergeIntentPipelineContext(
      { existing: "value" },
      {
        intent: "share-idea",
        scope: { lengthTier: "short" },
        legacyContentTypeId: "linkedin-post",
        wordTarget: { min: 150, max: 400 },
        channelHint: "professional-network"
      }
    );

    expect(merged).toEqual({
      existing: "value",
      wordTarget: { min: 150, max: 400 },
      generationIntent: "share-idea",
      generationChannel: "professional-network"
    });
  });

  it("returns request context unchanged when no resolved intent exists", () => {
    expect(mergeIntentPipelineContext({ keep: true }, undefined)).toEqual({ keep: true });
    expect(mergeIntentPipelineContext(undefined, undefined)).toBeUndefined();
  });
});
