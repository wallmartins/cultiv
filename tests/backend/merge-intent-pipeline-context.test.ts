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
      lengthTier: "short",
      generationIntent: "share-idea",
      generationChannel: "professional-network"
    });
  });

  it("returns request context unchanged when no resolved intent exists", () => {
    expect(mergeIntentPipelineContext({ keep: true }, undefined)).toEqual({ keep: true });
    expect(mergeIntentPipelineContext(undefined, undefined)).toBeUndefined();
  });

  it("merges compositor metadata when a compositor plan is provided", () => {
    const merged = mergeIntentPipelineContext(
      { existing: "value" },
      {
        intent: "share-idea",
        scope: { lengthTier: "medium", channel: "email" },
        legacyContentTypeId: "linkedin-post",
        wordTarget: { min: 400, max: 1200 },
        channelHint: "email"
      },
      {
        planId: "plan-test",
        planSignature: "edition-piece",
        steps: [{ name: "draft", skill: "draft", execution: "llm" }],
        parameters: {
          wordTarget: { min: 400, max: 1200 },
          expressionProfile: "email-share-idea",
          intent: "share-idea",
          lengthTier: "medium"
        }
      }
    );

    expect(merged).toEqual({
      existing: "value",
      wordTarget: { min: 400, max: 1200 },
      lengthTier: "medium",
      generationIntent: "share-idea",
      generationChannel: "email",
      compositor: {
        planId: "plan-test",
        planSignature: "edition-piece",
        expressionProfile: "email-share-idea",
        lengthTier: "medium",
        wordTarget: { min: 400, max: 1200 }
      }
    });
  });
});
