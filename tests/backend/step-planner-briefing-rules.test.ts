import { describe, expect, it } from "vitest";
import { planGeneration } from "../../apps/backend/src/product/generation/compositor/compositor-planner.js";
import { derivePatchOps } from "../../apps/backend/src/product/generation/step-planner/briefing-rules.js";
import { patchExecutionPlan } from "../../apps/backend/src/product/generation/step-planner/step-planner.js";

describe("derivePatchOps", () => {
  it("removes research and outline for explain-deeply with a short briefing", () => {
    const basePlan = planGeneration({
      intent: "explain-deeply",
      scope: { lengthTier: "long", channel: "blog" },
      qualityMode: "balanced"
    });

    const ops = derivePatchOps({
      briefing: { topic: "Brief overview" },
      intent: basePlan.parameters.intent,
      lengthTier: basePlan.parameters.lengthTier
    });

    expect(ops).toEqual([
      { type: "removeStep", name: "research" },
      { type: "removeStep", name: "outline" }
    ]);
  });

  it("does not trim research for explain-deeply when briefing text is long enough", () => {
    const basePlan = planGeneration({
      intent: "explain-deeply",
      scope: { lengthTier: "long", channel: "blog" },
      qualityMode: "balanced"
    });
    const briefing = {
      topic: "Deep dive",
      audience: "Engineers",
      context: "x".repeat(200)
    };

    const ops = derivePatchOps({
      briefing,
      intent: basePlan.parameters.intent,
      lengthTier: basePlan.parameters.lengthTier
    });

    expect(ops).toEqual([]);
  });

  it("removes hook for engage-audience when briefing has no question", () => {
    const basePlan = planGeneration({
      intent: "engage-audience",
      scope: { lengthTier: "short", channel: "social" },
      qualityMode: "balanced"
    });

    const ops = derivePatchOps({
      briefing: { topic: "Community update" },
      intent: basePlan.parameters.intent,
      lengthTier: basePlan.parameters.lengthTier
    });

    expect(ops).toEqual([{ type: "removeStep", name: "hook" }]);
  });

  it("keeps hook for engage-audience when briefing includes a question", () => {
    const basePlan = planGeneration({
      intent: "engage-audience",
      scope: { lengthTier: "short", channel: "social" },
      qualityMode: "balanced"
    });

    const ops = derivePatchOps({
      briefing: { topic: "Community update", question: "What would you change?" },
      intent: basePlan.parameters.intent,
      lengthTier: basePlan.parameters.lengthTier
    });

    expect(ops).toEqual([]);
  });

  it("inserts structure before draft for document-decision with long systemContext", () => {
    const basePlan = planGeneration({
      intent: "document-decision",
      scope: { lengthTier: "short" },
      qualityMode: "balanced"
    });

    const ops = derivePatchOps({
      briefing: {
        decision: "Adopt compositor planning",
        systemContext: "x".repeat(401)
      },
      intent: basePlan.parameters.intent,
      lengthTier: basePlan.parameters.lengthTier
    });

    expect(ops).toEqual([
      {
        type: "insertStep",
        before: "draft",
        step: {
          name: "structure",
          skill: "structure",
          execution: "llm",
          routingProfile: "premium-llm"
        }
      }
    ]);
  });
});

describe("patchExecutionPlan", () => {
  it("returns patched plan, ops, and base plan signature", () => {
    const basePlan = planGeneration({
      intent: "engage-audience",
      scope: { lengthTier: "short", channel: "social" },
      qualityMode: "balanced"
    });

    const result = patchExecutionPlan(basePlan, { topic: "Poll without a question" });

    expect(result.basePlanSignature).toBe("short-piece");
    expect(result.ops).toEqual([{ type: "removeStep", name: "hook" }]);
    expect(result.plan.steps.map((step) => step.name)).not.toContain("hook");
    expect(result.plan.planSignature).toBeDefined();
    expect(result.plan.planId).toBe(basePlan.planId);
  });
});
