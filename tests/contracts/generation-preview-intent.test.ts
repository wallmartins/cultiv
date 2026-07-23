import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import {
  GenerationPreviewRequestSchema,
  GenerationPreviewResponseSchema
} from "../../packages/contracts/src/generation-preview.js";
import { MeExecutionRequestSchema } from "../../packages/contracts/src/execution/request.js";

describe("generation preview and execution contracts", () => {
  it("decodes preview request with rhetoricalMode and scope", () => {
    const decoded = Schema.decodeUnknownSync(GenerationPreviewRequestSchema)({
      rhetoricalMode: "expound",
      scope: { lengthTier: "short", channel: "professional-network" },
      briefing: { topic: "Delegação" },
      qualityMode: "balanced"
    });

    expect(decoded.rhetoricalMode).toBe("expound");
    expect(decoded.scope?.lengthTier).toBe("short");
    expect(decoded.scope?.channel).toBe("professional-network");
  });

  it("decodes preview response with qualityModes options only", () => {
    const decoded = Schema.decodeUnknownSync(GenerationPreviewResponseSchema)({
      pricingSnapshot: {
        quoteId: "quote_123",
        policyVersion: "0.1.0",
        contentType: "short-piece",
        qualityMode: "balanced",
        creditPrice: 2.5
      },
      currentBalance: 2500,
      projectedBalanceAfterGeneration: 2497.5,
      quotaRemaining: 1000,
      quotaLimit: 1000,
      quotaCost: 1,
      canonicalCreditCost: 2.5,
      options: {
        qualityModes: []
      }
    });

    expect(decoded.pricingSnapshot.contentType).toBe("short-piece");
    expect(decoded.options.qualityModes).toEqual([]);
    expect((decoded as Record<string, unknown>).resolvedIntent).toBeUndefined();
  });

  it("decodes execution request with rhetoricalMode and scope", () => {
    const decoded = Schema.decodeUnknownSync(MeExecutionRequestSchema)({
      rhetoricalMode: "expound",
      scope: { lengthTier: "short" },
      briefing: "Quick thought on delegation",
      qualityMode: "balanced"
    });

    expect(decoded.rhetoricalMode).toBe("expound");
    expect(decoded.scope?.lengthTier).toBe("short");
  });

  it("decodes execution request with only a briefing (rhetoricalMode and scope both optional)", () => {
    const decoded = Schema.decodeUnknownSync(MeExecutionRequestSchema)({
      briefing: { topic: "Migração" },
      qualityMode: "strict"
    });

    expect(decoded.rhetoricalMode).toBeUndefined();
    expect(decoded.scope).toBeUndefined();
  });
});
