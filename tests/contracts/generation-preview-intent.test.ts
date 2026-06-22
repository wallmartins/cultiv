import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import {
  GenerationPreviewRequestSchema,
  GenerationPreviewResponseSchema
} from "../../packages/contracts/src/generation-preview.js";
import { MeExecutionRequestSchema } from "../../packages/contracts/src/execution/request.js";

describe("generation preview and execution intent contracts", () => {
  it("decodes preview request with intent and scope", () => {
    const decoded = Schema.decodeUnknownSync(GenerationPreviewRequestSchema)({
      intent: "share-idea",
      scope: { lengthTier: "short", channel: "professional-network" },
      briefing: { topic: "Delegação" },
      qualityMode: "balanced"
    });

    expect(decoded.intent).toBe("share-idea");
    expect(decoded.scope?.lengthTier).toBe("short");
    expect(decoded.scope?.channel).toBe("professional-network");
  });

  it("decodes preview response with resolvedIntent metadata", () => {
    const decoded = Schema.decodeUnknownSync(GenerationPreviewResponseSchema)({
      pricingSnapshot: {
        quoteId: "quote_123",
        policyVersion: "0.1.0",
        contentType: "linkedin-post",
        qualityMode: "balanced",
        creditPrice: 2.5
      },
      currentBalance: 2500,
      projectedBalanceAfterGeneration: 2497.5,
      quotaRemaining: 1000,
      quotaLimit: 1000,
      quotaCost: 1,
      canonicalCreditCost: 2.5,
      resolvedIntent: {
        intent: "share-idea",
        scope: { lengthTier: "short" },
        wordTargetMin: 150,
        wordTargetMax: 400
      },
      options: {
        contentTypes: [],
        qualityModes: []
      }
    });

    expect(decoded.resolvedIntent?.intent).toBe("share-idea");
    expect(decoded.resolvedIntent?.scope.lengthTier).toBe("short");
    expect(decoded.resolvedIntent?.wordTargetMin).toBe(150);
    expect(decoded.resolvedIntent?.wordTargetMax).toBe(400);
  });

  it("decodes execution request with intent and scope without contentType", () => {
    const decoded = Schema.decodeUnknownSync(MeExecutionRequestSchema)({
      intent: "share-idea",
      scope: { lengthTier: "short" },
      briefing: "Quick thought on delegation",
      qualityMode: "balanced"
    });

    expect(decoded.intent).toBe("share-idea");
    expect(decoded.scope?.lengthTier).toBe("short");
    expect(decoded.contentType).toBeUndefined();
  });

  it("still decodes legacy execution request with contentType only", () => {
    const decoded = Schema.decodeUnknownSync(MeExecutionRequestSchema)({
      contentType: "newsletter",
      briefing: { topic: "Migração" },
      qualityMode: "strict"
    });

    expect(decoded.contentType).toBe("newsletter");
    expect(decoded.intent).toBeUndefined();
  });
});
