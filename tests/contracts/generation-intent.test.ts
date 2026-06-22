import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import {
  GenerationIntentSchema,
  GenerationScopeSchema,
  GenerationIntentRequestSchema
} from "../../packages/contracts/src/generation-intent.js";

describe("generation intent contracts", () => {
  it("decodes a valid intent request", () => {
    const decoded = Schema.decodeUnknownSync(GenerationIntentRequestSchema)({
      intent: "share-idea",
      scope: { lengthTier: "short", channel: "professional-network" },
      briefing: { topic: "Delegação" }
    });
    expect(decoded.intent).toBe("share-idea");
    expect(decoded.scope.lengthTier).toBe("short");
  });

  it("rejects unknown intent", () => {
    expect(() =>
      Schema.decodeUnknownSync(GenerationIntentSchema)("blog-post")
    ).toThrow();
  });
});
