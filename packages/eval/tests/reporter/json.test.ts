import { describe, expect, it } from "vitest";
import { reportJSON } from "../../src/reporter/json.js";
import type { EvalReport } from "../../src/types.js";

function buildReport(overrides: Partial<EvalReport> = {}): EvalReport {
  return {
    timestamp: "2024-01-01T00:00:00.000Z",
    durationMs: 100,
    config: {
      includeJudge: false,
      compare: false,
      saveBaseline: false,
      reportFormat: "json",
      threshold: 5
    },
    suites: [],
    results: [],
    ...overrides
  };
}

describe("reportJSON", () => {
  it("returns a valid JSON string", () => {
    const report = buildReport();
    const output = reportJSON(report);

    expect(() => JSON.parse(output)).not.toThrow();
  });

  it("pretty-prints by default", () => {
    const report = buildReport();
    const output = reportJSON(report);

    expect(output).toContain("\n");
    expect(output).toContain("  ");
  });

  it("minifies when compact option is true", () => {
    const report = buildReport();
    const output = reportJSON(report, { compact: true });

    expect(output).not.toContain("\n  ");
  });

  it("includes all report fields", () => {
    const report = buildReport({
      version: "v1.0.0",
      baselineComparison: {
        currentVersion: "v2.0.0",
        previousVersion: "v1.0.0",
        regressions: [],
        warnings: [],
        improvements: [],
        stable: [],
        newCases: [],
        removedCases: [],
        summary: {
          regressionCount: 0,
          warningCount: 0,
          improvementCount: 0,
          stableCount: 0,
          newCaseCount: 0,
          removedCaseCount: 0
        }
      }
    });

    const parsed = JSON.parse(reportJSON(report)) as EvalReport;

    expect(parsed.timestamp).toBe(report.timestamp);
    expect(parsed.version).toBe("v1.0.0");
    expect(parsed.baselineComparison).toBeDefined();
  });
});
