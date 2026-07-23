import { describe, expect, it } from "vitest";
import { resolveExecutionPresentation } from "@my-ai-orchestrator/contracts";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";

describe("resolveExecutionPresentation", () => {
  it("reads rhetorical mode, length tier, channel, and topic from compositor pipeline requests", () => {
    const request = {
      userId: "user-1",
      pipeline: { name: "short-piece", steps: [] },
      inputs: { topic: "Aprendizado contínuo na carreira" },
      context: {
        rhetoricalMode: "expound",
        generationChannel: "professional-network",
        compositor: {
          planId: "plan-1",
          planSignature: "short-piece",
          expressionProfile: "hook",
          lengthTier: "short",
          wordTarget: { min: 150, max: 400 }
        }
      }
    } satisfies PipelineRequest;

    expect(resolveExecutionPresentation(request, "short-piece")).toEqual({
      rhetoricalMode: "expound",
      briefingTopic: "Aprendizado contínuo na carreira",
      lengthTier: "short",
      channel: "professional-network"
    });
  });

  it("only summarizes the briefing topic when compositor metadata is missing", () => {
    const request = {
      userId: "user-1",
      pipelineType: "edition-piece",
      briefing: { topic: "Atualização semanal" }
    } satisfies PipelineRequest;

    expect(resolveExecutionPresentation(request, "edition-piece")).toEqual({
      briefingTopic: "Atualização semanal"
    });
  });

  it("summarizes plain-text briefing when topic is absent", () => {
    const request = {
      userId: "user-1",
      pipelineType: "short-piece",
      briefing: "  Ideia sobre consistência editorial  "
    } satisfies PipelineRequest;

    expect(resolveExecutionPresentation(request, "short-piece")).toEqual({
      briefingTopic: "Ideia sobre consistência editorial"
    });
  });
});
