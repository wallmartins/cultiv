import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import {
  ExecutionPlanSchema,
  PlanSignatureSchema
} from "../../packages/contracts/src/generation-compositor.js";

describe("generation compositor contracts", () => {
  it("decodes a valid execution plan", () => {
    const decoded = Schema.decodeUnknownSync(ExecutionPlanSchema)({
      planId: "plan-1",
      planSignature: "edition-piece",
      steps: [
        { name: "draft", skill: "draft", execution: "llm", routingProfile: "default-llm" }
      ],
      parameters: {
        wordTarget: { min: 400, max: 1200 },
        expressionProfile: "email-share-idea",
        intent: "share-idea",
        lengthTier: "medium"
      }
    });
    expect(decoded.planSignature).toBe("edition-piece");
  });

  it("rejects unknown plan signature", () => {
    expect(() => Schema.decodeUnknownSync(PlanSignatureSchema)("linkedin-post")).toThrow();
  });
});
