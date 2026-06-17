import { describe, expect, it } from "vitest";
import { collectDevelopmentFindings } from "@my-ai-orchestrator/text-quality";
import { TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE } from "../../apps/backend/src/product/voice/argument-development-extraction.js";

describe("development critic", () => {
  const development = TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development;

  it("flags premature thesis for exploratory development", () => {
    const findings = collectDevelopmentFindings(
      development,
      "Portanto a conclusão é clara logo no início.\n\nDepois ainda há contexto.",
      "draft"
    );

    expect(findings.some((finding) => finding.type === "structural_premature_thesis")).toBe(true);
  });

  it("flags advocacy language for exploratory development", () => {
    const findings = collectDevelopmentFindings(
      development,
      "Você deve sempre fazer assim sem hesitar.",
      "draft"
    );

    expect(findings.some((finding) => finding.type === "structural_advocacy_arc")).toBe(true);
  });

  it("returns no findings when development signature is absent", () => {
    expect(collectDevelopmentFindings(undefined, "Any text", "draft")).toEqual([]);
  });
});
