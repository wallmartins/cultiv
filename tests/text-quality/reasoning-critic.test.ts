import { describe, expect, it } from "vitest";
import { collectReasoningFindings } from "@my-ai-orchestrator/text-quality";

const core = {
  narrativeProse: "Observes before concluding.",
  certaintyLevel: "moderate" as const,
  judgmentFrequency: "low" as const,
  conclusionPace: "slow" as const,
  readerRelationship: "peer" as const,
  authoritySource: "personal_observation" as const,
  derivedAntiPatterns: ["generic linkedin tone"]
};

describe("reasoning critic findings", () => {
  it("emits one finding per drift note without duplicate generic drift", () => {
    const text = "Obviamente todo mundo sempre deveria fazer assim sem exceção.";
    const findings = collectReasoningFindings(core, text, "draft");

    expect(findings.length).toBeGreaterThan(0);
    expect(findings.filter((finding) => finding.message.includes("absolutist"))).toHaveLength(1);
    expect(findings.filter((finding) => finding.message === "Reasoning drift detected")).toHaveLength(0);
  });
});
