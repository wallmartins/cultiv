import { describe, expect, it } from "vitest";
import { criticizeText } from "../../packages/text-quality/src/quality/critic.js";
import {
  containsEmDash,
  replaceEmDashesWithCommas
} from "../../packages/text-quality/src/quality/em-dash.js";
import { evaluateLexicalQuality } from "../../packages/text-quality/src/quality/lexical-quality.js";
import { humanizeText, refineText } from "../../packages/text-quality/src/quality/humanizer.js";

describe("em dash policy", () => {
  it("detects em and en dashes", () => {
    expect(containsEmDash("Aprendi mais — com calma.")).toBe(true);
    expect(containsEmDash(`Aprendi mais ${"\u2013"} com calma.`)).toBe(true);
    expect(containsEmDash("Aprendi mais, com calma.")).toBe(false);
  });

  it("replaces dash separators with commas", () => {
    expect(replaceEmDashesWithCommas("Parei de correr — hoje escolho um tema.")).toBe(
      "Parei de correr, hoje escolho um tema."
    );
  });

  it("penalizes em dashes in lexical quality", () => {
    const evaluation = evaluateLexicalQuality("Aprendi mais — com calma — todos os dias.");
    expect(evaluation.metrics.emDashCount).toBe(2);
    expect(evaluation.findings).toContain("Text uses em dashes instead of commas or periods");
  });

  it("flags em dashes in critic", () => {
    const critic = criticizeText("Aprendi mais — com calma.");
    expect(critic.findings.some((finding) => finding.message.includes("em dashes"))).toBe(true);
  });

  it("strips em dashes during humanize and refine", () => {
    expect(humanizeText("Aprendi mais — com calma.")).toBe("Aprendi mais, com calma.");
    expect(refineText("Aprendi mais — com calma.")).toBe("Aprendi mais, com calma.");
  });
});
