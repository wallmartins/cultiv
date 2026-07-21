import { describe, expect, it } from "vitest";
import { resolveEffectiveWordTarget, toIntentWordTarget } from "@my-ai-orchestrator/text-quality";
import { planGeneration } from "../../apps/backend/src/product/generation/compositor/compositor-planner.js";
import { materializeCompositorPipeline } from "../../apps/backend/src/product/generation/compositor/plan-materializer.js";

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

describe("CompositorPlanner", () => {
  it("expound short professional-network → short-piece with hook", () => {
    const plan = planGeneration({
      rhetoricalMode: "expound",
      scope: { lengthTier: "short", channel: "professional-network" },
      qualityMode: "balanced"
    });
    expect(plan.planSignature).toBe("short-piece");
    expect(plan.steps.map((s) => s.name)).toContain("hook");
    expect(plan.parameters.expressionProfile).toBe("professional-expound");
    expect(plan.parameters.wordTarget).toEqual(
      expectedWordTarget({
        contentType: "linkedin-post",
        lengthTier: "short",
        channel: "professional-network"
      })
    );
  });

  it("expound medium email → edition-piece without hook", () => {
    const plan = planGeneration({
      rhetoricalMode: "expound",
      scope: { lengthTier: "medium", channel: "email" },
      qualityMode: "balanced"
    });
    expect(plan.planSignature).toBe("edition-piece");
    expect(plan.steps.map((s) => s.name)).not.toContain("hook");
    expect(plan.parameters.expressionProfile).toBe("email-expound");
  });

  it("expound long blog → long-piece with research", () => {
    const plan = planGeneration({
      rhetoricalMode: "expound",
      scope: { lengthTier: "long", channel: "blog" },
      qualityMode: "balanced"
    });
    expect(plan.planSignature).toBe("long-piece");
    expect(plan.steps.map((s) => s.name)).toContain("research");
    expect(plan.parameters.expressionProfile).toBe("blog-expound");
  });

  it("argue medium unspecified channel → structure step when applicable", () => {
    const plan = planGeneration({
      rhetoricalMode: "argue",
      scope: { lengthTier: "medium" },
      qualityMode: "balanced"
    });
    expect(plan.steps.map((s) => s.name)).toContain("structure");
    expect(plan.parameters.expressionProfile).toBe("argue-default");
  });

  it("argue short social → short-piece", () => {
    const plan = planGeneration({
      rhetoricalMode: "argue",
      scope: { lengthTier: "short", channel: "social" },
      qualityMode: "balanced"
    });
    expect(plan.planSignature).toBe("short-piece");
    expect(plan.parameters.expressionProfile).toBe("social-argue");
  });

  it("narrate medium unspecified channel → serial-piece", () => {
    const plan = planGeneration({
      rhetoricalMode: "narrate",
      scope: { lengthTier: "medium" },
      qualityMode: "balanced"
    });
    expect(plan.planSignature).toBe("serial-piece");
    expect(plan.parameters.expressionProfile).toBe("narrate-default");
  });

  it("materializeCompositorPipeline maps plan to pipeline definition", () => {
    const plan = planGeneration({
      rhetoricalMode: "expound",
      scope: { lengthTier: "medium", channel: "email" },
      qualityMode: "balanced"
    });
    const pipeline = materializeCompositorPipeline(plan);
    expect(pipeline.name).toBe("edition-piece");
    expect(pipeline.steps.length).toBe(plan.steps.length);
    expect(pipeline.steps[0]).toMatchObject({
      name: plan.steps[0]!.name,
      skill: plan.steps[0]!.skill
    });
  });
});
