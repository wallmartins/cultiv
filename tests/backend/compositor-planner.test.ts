import { describe, expect, it } from "vitest";
import { planGeneration } from "../../apps/backend/src/product/generation/compositor/compositor-planner.js";
import { materializeCompositorPipeline } from "../../apps/backend/src/product/generation/compositor/plan-materializer.js";

describe("CompositorPlanner", () => {
  it("share-idea short professional-network → short-piece with hook", () => {
    const plan = planGeneration({
      intent: "share-idea",
      scope: { lengthTier: "short", channel: "professional-network" },
      qualityMode: "balanced"
    });
    expect(plan.planSignature).toBe("short-piece");
    expect(plan.steps.map((s) => s.name)).toContain("hook");
    expect(plan.parameters.expressionProfile).toBe("professional-share-idea");
    expect(plan.parameters.wordTarget).toEqual({ min: 150, max: 400 });
  });

  it("share-idea medium email → edition-piece without hook", () => {
    const plan = planGeneration({
      intent: "share-idea",
      scope: { lengthTier: "medium", channel: "email" },
      qualityMode: "balanced"
    });
    expect(plan.planSignature).toBe("edition-piece");
    expect(plan.steps.map((s) => s.name)).not.toContain("hook");
    expect(plan.parameters.expressionProfile).toBe("email-share-idea");
  });

  it("explain-deeply long blog → long-piece with research", () => {
    const plan = planGeneration({
      intent: "explain-deeply",
      scope: { lengthTier: "long", channel: "blog" },
      qualityMode: "balanced"
    });
    expect(plan.planSignature).toBe("long-piece");
    expect(plan.steps.map((s) => s.name)).toContain("research");
    expect(plan.parameters.expressionProfile).toBe("blog-explain-deeply");
  });

  it("document-decision medium → structure step when applicable", () => {
    const plan = planGeneration({
      intent: "document-decision",
      scope: { lengthTier: "medium" },
      qualityMode: "balanced"
    });
    expect(plan.steps.map((s) => s.name)).toContain("structure");
    expect(plan.parameters.expressionProfile).toBe("document-decision-default");
  });

  it("engage-audience short social → short-piece", () => {
    const plan = planGeneration({
      intent: "engage-audience",
      scope: { lengthTier: "short", channel: "social" },
      qualityMode: "balanced"
    });
    expect(plan.planSignature).toBe("short-piece");
    expect(plan.parameters.expressionProfile).toBe("social-engage-audience");
  });

  it("tell-story medium → serial-piece", () => {
    const plan = planGeneration({
      intent: "tell-story",
      scope: { lengthTier: "medium" },
      qualityMode: "balanced"
    });
    expect(plan.planSignature).toBe("serial-piece");
    expect(plan.parameters.expressionProfile).toBe("tell-story-default");
  });

  it("materializeCompositorPipeline maps plan to pipeline definition", () => {
    const plan = planGeneration({
      intent: "share-idea",
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
