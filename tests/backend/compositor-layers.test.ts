import { describe, expect, it } from "vitest";
import { pickBasePreset, resolveExpressionProfile } from "../../apps/backend/src/product/generation/compositor/expression.js";
import { modeUsesStructureStep } from "../../apps/backend/src/product/generation/compositor/rhetorical-profiles.js";
import { gateHeavySteps, resolveWordTarget } from "../../apps/backend/src/product/generation/compositor/scale.js";
import { resolveEffectiveWordTarget, toIntentWordTarget } from "@my-ai-orchestrator/text-quality";

function expectedWordTarget(args: {
  readonly contentType: string;
  readonly lengthTier: "short" | "medium" | "long";
  readonly channel?: "professional-network" | "email" | "social" | "blog" | "unspecified";
}) {
  return toIntentWordTarget(
    resolveEffectiveWordTarget({
      contentType: args.contentType,
      lengthTier: args.lengthTier,
      channel: args.channel
    })
  );
}

describe("compositor layers", () => {
  it("resolveWordTarget uses effective targets for linkedin medium", () => {
    expect(
      resolveWordTarget({
        lengthTier: "medium",
        channel: "professional-network"
      })
    ).toEqual(expectedWordTarget({
      contentType: "linkedin-post",
      lengthTier: "medium",
      channel: "professional-network"
    }));
  });

  it("gateHeavySteps allows research/outline only for long tier", () => {
    expect(gateHeavySteps("short")).toBe(false);
    expect(gateHeavySteps("medium")).toBe(false);
    expect(gateHeavySteps("long")).toBe(true);
  });

  it("resolveExpressionProfile for email channel", () => {
    expect(resolveExpressionProfile({ rhetoricalMode: "expound", channel: "email" })).toBe("email-expound");
  });

  it("resolveExpressionProfile for unspecified channel", () => {
    expect(resolveExpressionProfile({ rhetoricalMode: "expound", channel: "unspecified" })).toBe(
      "expound-default"
    );
  });

  it("pickBasePreset for expound long", () => {
    expect(pickBasePreset({ rhetoricalMode: "expound", lengthTier: "long" })).toBe("long-piece");
  });

  it("pickBasePreset for expound short professional-network", () => {
    expect(
      pickBasePreset({
        rhetoricalMode: "expound",
        lengthTier: "short",
        channel: "professional-network"
      })
    ).toBe("short-piece");
  });

  it("argue mode enables the structure step", () => {
    expect(modeUsesStructureStep("argue")).toBe(true);
  });

  it("expound mode does not enable the structure step", () => {
    expect(modeUsesStructureStep("expound")).toBe(false);
  });
});
