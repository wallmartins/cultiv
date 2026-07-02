import { describe, expect, it } from "vitest";
import { pickBasePreset, resolveExpressionProfile } from "../../apps/backend/src/product/generation/compositor/expression.js";
import { getRhetoricalProfile } from "../../apps/backend/src/product/generation/compositor/rhetorical-profiles.js";
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
        intent: "engage-audience",
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
    expect(resolveExpressionProfile({ intent: "share-idea", channel: "email" })).toBe("email-share-idea");
  });

  it("resolveExpressionProfile for unspecified channel", () => {
    expect(resolveExpressionProfile({ intent: "share-idea", channel: "unspecified" })).toBe(
      "share-idea-default"
    );
  });

  it("pickBasePreset for explain-deeply long", () => {
    expect(pickBasePreset({ intent: "explain-deeply", lengthTier: "long" })).toBe("long-piece");
  });

  it("pickBasePreset for share-idea short professional-network", () => {
    expect(
      pickBasePreset({
        intent: "share-idea",
        lengthTier: "short",
        channel: "professional-network"
      })
    ).toBe("short-piece");
  });

  it("document-decision medium enables structure step in rhetorical profile", () => {
    expect(getRhetoricalProfile("document-decision").structureStep).toBe("structure");
  });

  it("share-idea does not enable structure step", () => {
    expect(getRhetoricalProfile("share-idea").structureStep).toBeUndefined();
  });
});
