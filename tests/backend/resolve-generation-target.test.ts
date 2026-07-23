import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { BackendValidationError } from "../../apps/backend/src/http/errors.js";
import { resolveGenerationTarget } from "../../apps/backend/src/product/generation/resolve-generation-target.js";

describe("resolveGenerationTarget", () => {
  it("resolves rhetoricalMode and scope to a compositor plan keyed by planSignature", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        rhetoricalMode: "expound",
        scope: { lengthTier: "short" }
      })
    );

    expect(resolved.contentTypeId).toBe("short-piece");
    expect(resolved.compositor.plan.planSignature).toBe("short-piece");
    expect(resolved.compositor.pipeline).toBeDefined();
  });

  it("defaults rhetoricalMode to expound when omitted", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        scope: { lengthTier: "short" }
      })
    );

    expect(resolved.compositor.plan.parameters.rhetoricalMode).toBe("expound");
  });

  it("fails when no scope is provided", async () => {
    const result = await Effect.runPromise(Effect.either(resolveGenerationTarget({})));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(BackendValidationError);
      expect(result.left.message).toContain("A generation scope (length tier and channel) is required");
    }
  });

  it("fails when rhetoricalMode is provided without scope", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        resolveGenerationTarget({
          rhetoricalMode: "expound"
        })
      )
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(BackendValidationError);
    }
  });
});
