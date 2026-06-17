import { describe, expect, it } from "vitest";
import {
  evaluateReasoningDrift,
  hasPrematureConclusion
} from "@my-ai-orchestrator/text-quality";

describe("reasoning drift", () => {
  const core = {
    narrativeProse: "Observes before concluding.",
    certaintyLevel: "moderate" as const,
    judgmentFrequency: "low" as const,
    conclusionPace: "slow" as const,
    readerRelationship: "peer" as const,
    authoritySource: "personal_observation" as const,
    derivedAntiPatterns: ["generic linkedin tone"]
  };

  it("penalizes absolutisms when certainty is moderate", () => {
    const result = evaluateReasoningDrift(
      core,
      "Obviamente isso sempre funciona para todo mundo sem exceção."
    );

    expect(result.score).toBeLessThan(80);
    expect(result.notes.some((note) => note.includes("absolutist"))).toBe(true);
  });

  it("flags premature conclusion when pace is slow", () => {
    const text = "Portanto a conclusão é clara. Depois disso ainda há contexto.";
    expect(hasPrematureConclusion(text, "draft")).toBe(true);

    const result = evaluateReasoningDrift(core, text, "draft");
    expect(result.notes.some((note) => note.includes("conclusion"))).toBe(true);
  });

  it("penalizes rhetorical inflation", () => {
    const result = evaluateReasoningDrift(
      core,
      "Esta abordagem revolucionária vai transformar completamente sua carreira para sempre."
    );

    expect(result.score).toBeLessThan(80);
    expect(result.notes.some((note) => note.includes("rhetorical inflation"))).toBe(true);
  });

  it("penalizes excessive hedging for high-certainty authors", () => {
    const result = evaluateReasoningDrift(
      {
        ...core,
        certaintyLevel: "high",
        conclusionPace: "fast"
      },
      "Talvez, em alguns casos, dependendo do contexto, possivelmente métricas importem."
    );

    expect(result.score).toBeLessThan(80);
    expect(result.notes.some((note) => note.includes("hedges excessively"))).toBe(true);
  });
});
