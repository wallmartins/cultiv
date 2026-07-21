import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import { GenerationScopeSchema } from "../../packages/contracts/src/generation-scope.js";
import { RhetoricalModeSchema } from "../../packages/contracts/src/reasoning.js";

describe("generation intent contracts", () => {
  it("decodes a valid rhetorical mode and scope", () => {
    const mode = Schema.decodeUnknownSync(RhetoricalModeSchema)("expound");
    const scope = Schema.decodeUnknownSync(GenerationScopeSchema)({
      lengthTier: "short",
      channel: "professional-network"
    });
    expect(mode).toBe("expound");
    expect(scope.lengthTier).toBe("short");
  });

  it("rejects unknown rhetorical mode", () => {
    expect(() => Schema.decodeUnknownSync(RhetoricalModeSchema)("blog-post")).toThrow();
  });
});
