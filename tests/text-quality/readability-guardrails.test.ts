import { describe, expect, it } from "vitest";
import {
  collectReadabilityFindings,
  resolveReadabilityLimits
} from "../../packages/text-quality/src/quality/readability-guardrails.js";

describe("readability guardrails", () => {
  it("flags long sentences and dense paragraphs", () => {
    const longSentence = Array.from({ length: 42 }, (_, index) => `word${index}`).join(" ");
    const denseParagraph = Array.from({ length: 8 }, () => longSentence).join(" ");
    const text = `${denseParagraph}.\n\nAnother short paragraph.`;

    const findings = collectReadabilityFindings(
      text,
      resolveReadabilityLimits({
        target: { minWords: 130, maxWords: 300, idealWords: 200 },
        quantitativeSignals: {
          aggregate: { avgSentenceLength: 18, avgParagraphLength: 55 }
        } as never
      })
    );

    expect(findings.some((finding) => finding.message.includes("Sentence exceeds readability cap"))).toBe(true);
    expect(findings.some((finding) => finding.message.includes("Paragraph exceeds readability cap"))).toBe(true);
  });

  it("flags repeated trigrams across paragraphs", () => {
    const text = [
      "Leaders need clarity before they can move teams forward with confidence.",
      "Leaders need clarity before they can move teams forward with confidence again."
    ].join("\n\n");

    const findings = collectReadabilityFindings(
      text,
      resolveReadabilityLimits({
        target: { minWords: 130, maxWords: 300, idealWords: 200 }
      })
    );

    expect(findings.some((finding) => finding.message.includes("repeats phrasing across paragraphs"))).toBe(true);
  });
});
