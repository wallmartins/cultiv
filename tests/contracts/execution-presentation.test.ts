import { describe, expect, it } from "vitest";
import { resolveExecutionPresentation } from "@my-ai-orchestrator/contracts";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";

describe("resolveExecutionPresentation", () => {
  it("reads intent, length tier, channel, and topic from compositor pipeline requests", () => {
    const request = {
      userId: "user-1",
      pipeline: { name: "short-piece", steps: [] },
      inputs: { topic: "Aprendizado contínuo na carreira" },
      context: {
        generationIntent: "share-idea",
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
      generationIntent: "share-idea",
      briefingTopic: "Aprendizado contínuo na carreira",
      lengthTier: "short",
      channel: "professional-network"
    });
  });

  it("falls back to legacy content type mapping when intent metadata is missing", () => {
    const request = {
      userId: "user-1",
      pipelineType: "newsletter",
      briefing: { topic: "Atualização semanal" },
      contentType: "newsletter"
    } satisfies PipelineRequest;

    expect(resolveExecutionPresentation(request, "newsletter")).toEqual({
      generationIntent: "update-subscribers",
      briefingTopic: "Atualização semanal",
      lengthTier: "long"
    });
  });

  it("summarizes plain-text briefing when topic is absent", () => {
    const request = {
      userId: "user-1",
      pipelineType: "linkedin-post",
      briefing: "  Ideia sobre consistência editorial  ",
      contentType: "linkedin-post"
    } satisfies PipelineRequest;

    expect(resolveExecutionPresentation(request, "linkedin-post")).toMatchObject({
      generationIntent: "share-idea",
      briefingTopic: "Ideia sobre consistência editorial",
      lengthTier: "short"
    });
  });
});
