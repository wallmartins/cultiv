import { describe, expect, it } from "vitest";
import { reportMarkdown } from "../../src/reporter/markdown.js";
import type { EvalReport, RegressionReport } from "../../src/types.js";

function buildReport(overrides: Partial<EvalReport> = {}): EvalReport {
  return {
    timestamp: "2024-01-01T00:00:00.000Z",
    durationMs: 100,
    config: {
      includeJudge: false,
      compare: false,
      saveBaseline: false,
      reportFormat: "markdown",
      threshold: 5
    },
    suites: [
      { name: "voice-fidelity", caseCount: 1, passedCount: 1, avgEvalComposite: 80, minEvalComposite: 80, passRate: 100 }
    ],
    results: [
      {
        caseId: "case-01",
        suite: "voice-fidelity",
        text: "sample",
        scores: { deterministic: 100, heuristic: 80, evalComposite: 85 },
        deterministic: { score: 100, checks: [] },
        heuristic: { score: 80, subScores: { critic: 80, fidelity: 80, drift: 80 } },
        passed: true,
        durationMs: 10
      }
    ],
    ...overrides
  };
}

const baselineComparison: RegressionReport = {
  currentVersion: "v2.0.0",
  previousVersion: "v1.0.0",
  regressions: [{ caseId: "case-01", previousScore: 90, currentScore: 85, delta: -5, classification: "regression" }],
  warnings: [],
  improvements: [{ caseId: "case-02", previousScore: 70, currentScore: 80, delta: 10, classification: "improvement" }],
  stable: [],
  newCases: [],
  removedCases: [],
  summary: {
    regressionCount: 1,
    warningCount: 0,
    improvementCount: 1,
    stableCount: 0,
    newCaseCount: 0,
    removedCaseCount: 0
  }
};

describe("reportMarkdown", () => {
  it("includes a summary header", () => {
    const output = reportMarkdown(buildReport());

    expect(output).toContain("# Eval Report");
    expect(output).toContain("Overall score:");
  });

  it("renders a per-suite results table", () => {
    const output = reportMarkdown(buildReport());

    expect(output).toContain("| Suite | Cases | Passed | Avg | Min | Pass Rate |");
    expect(output).toContain("voice-fidelity");
  });

  it("renders a per-case results table", () => {
    const output = reportMarkdown(buildReport());

    expect(output).toContain("| Case | Suite | Composite | Deterministic | Heuristic | Judge | Status |");
    expect(output).toContain("case-01");
  });

  it("shows regressions and improvements when baseline comparison is present", () => {
    const output = reportMarkdown(buildReport({ baselineComparison }));

    expect(output).toContain("## Baseline Comparison");
    expect(output).toContain("### Regressions");
    expect(output).toContain("### Improvements");
    expect(output).toContain("case-01");
    expect(output).toContain("case-02");
  });

  it("uses emoji indicators for status", () => {
    const output = reportMarkdown(buildReport({ baselineComparison }));

    expect(output).toContain("❌");
  });

  it("includes configuration metadata", () => {
    const output = reportMarkdown(buildReport());

    expect(output).toContain("## Configuration");
    expect(output).toContain("includeJudge");
    expect(output).toContain("reportFormat");
  });
});
