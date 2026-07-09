import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  compareBaselines,
  getLatestBaseline,
  listBaselines,
  loadBaseline,
  loadLatestBaseline,
  saveBaseline
} from "../src/baseline.js";
import type { EvalBaseline, EvalReport } from "../src/types.js";

function buildReport(overrides: Partial<EvalReport> = {}): EvalReport {
  return {
    timestamp: new Date().toISOString(),
    durationMs: 100,
    config: {
      includeJudge: false,
      compare: false,
      saveBaseline: false,
      reportFormat: "json",
      threshold: 5
    },
    suites: [
      { name: "voice-fidelity", caseCount: 1, passedCount: 1, avgEvalComposite: 80, minEvalComposite: 80, passRate: 100 }
    ],
    results: [
      {
        caseId: "voice-fidelity-blog-formal-01",
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

describe("saveBaseline", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(resolve(tmpdir(), "eval-baseline-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("writes one baseline file per suite", () => {
    const report = buildReport();
    const saved = saveBaseline(report, "v1.0.0", tempDir);

    expect(saved).toHaveLength(1);
    expect(saved[0]?.suite).toBe("voice-fidelity");
    expect(saved[0]?.version).toBe("v1.0.0");
  });

  it("creates the directory structure automatically", () => {
    const report = buildReport();
    saveBaseline(report, "v1.0.0", tempDir);

    const loaded = loadBaseline("voice-fidelity", "v1.0.0", tempDir);
    expect(loaded).not.toBeNull();
    expect(loaded?.results).toHaveLength(1);
  });
});

describe("loadBaseline", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(resolve(tmpdir(), "eval-baseline-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns null for a missing baseline", () => {
    const baseline = loadBaseline("voice-fidelity", "missing", tempDir);

    expect(baseline).toBeNull();
  });

  it("loads a specific baseline version", () => {
    const report = buildReport();
    saveBaseline(report, "v1.0.0", tempDir);

    const loaded = loadBaseline("voice-fidelity", "v1.0.0", tempDir);

    expect(loaded?.version).toBe("v1.0.0");
    expect(loaded?.summary.avgEvalComposite).toBe(85);
  });
});

describe("loadLatestBaseline / getLatestBaseline", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(resolve(tmpdir(), "eval-baseline-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns the most recent baseline", () => {
    const olderReport = buildReport({ timestamp: "2024-01-01T00:00:00.000Z" });
    const newerReport = buildReport({ timestamp: "2024-02-01T00:00:00.000Z" });

    saveBaseline(olderReport, "v1.0.0", tempDir);
    saveBaseline(newerReport, "v1.1.0", tempDir);

    const latest = loadLatestBaseline("voice-fidelity", tempDir);

    expect(latest?.version).toBe("v1.1.0");
  });

  it("returns null when no baselines exist", () => {
    const latest = getLatestBaseline("voice-fidelity", tempDir);

    expect(latest).toBeNull();
  });
});

describe("listBaselines", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(resolve(tmpdir(), "eval-baseline-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists baseline versions sorted by recency", () => {
    const olderReport = buildReport({ timestamp: "2024-01-01T00:00:00.000Z" });
    const newerReport = buildReport({ timestamp: "2024-02-01T00:00:00.000Z" });

    saveBaseline(olderReport, "v1.0.0", tempDir);
    saveBaseline(newerReport, "v1.1.0", tempDir);

    const entries = listBaselines("voice-fidelity", tempDir);

    expect(entries).toHaveLength(2);
    expect(entries[0]?.version).toBe("v1.1.0");
    expect(entries[1]?.version).toBe("v1.0.0");
  });

  it("returns an empty array for a suite with no baselines", () => {
    const entries = listBaselines("missing-suite", tempDir);

    expect(entries).toHaveLength(0);
  });
});

function buildBaseline(suite: string, results: { caseId: string; evalComposite: number }[], version: string): EvalBaseline {
  return {
    version,
    timestamp: new Date().toISOString(),
    suite,
    results: results.map((r) => ({ caseId: r.caseId, scores: { deterministic: 0, heuristic: 0, evalComposite: r.evalComposite } })),
    summary: {
      avgEvalComposite: 0,
      minEvalComposite: 0,
      passRate: 0,
      regressions: []
    }
  };
}

describe("compareBaselines", () => {
  it("classifies a large score drop as regression", () => {
    const previous = buildBaseline("suite", [{ caseId: "a", evalComposite: 90 }], "v1");
    const current = buildBaseline("suite", [{ caseId: "a", evalComposite: 80 }], "v2");

    const report = compareBaselines(current, previous);

    expect(report.regressions).toHaveLength(1);
    expect(report.regressions[0]?.delta).toBe(-10);
  });

  it("classifies a moderate score drop as warning", () => {
    const previous = buildBaseline("suite", [{ caseId: "a", evalComposite: 90 }], "v1");
    const current = buildBaseline("suite", [{ caseId: "a", evalComposite: 87 }], "v2");

    const report = compareBaselines(current, previous);

    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0]?.delta).toBe(-3);
  });

  it("classifies a large score rise as improvement", () => {
    const previous = buildBaseline("suite", [{ caseId: "a", evalComposite: 80 }], "v1");
    const current = buildBaseline("suite", [{ caseId: "a", evalComposite: 90 }], "v2");

    const report = compareBaselines(current, previous);

    expect(report.improvements).toHaveLength(1);
    expect(report.improvements[0]?.delta).toBe(10);
  });

  it("classifies a small change as stable", () => {
    const previous = buildBaseline("suite", [{ caseId: "a", evalComposite: 85 }], "v1");
    const current = buildBaseline("suite", [{ caseId: "a", evalComposite: 86 }], "v2");

    const report = compareBaselines(current, previous);

    expect(report.stable).toHaveLength(1);
    expect(report.regressions).toHaveLength(0);
    expect(report.improvements).toHaveLength(0);
  });

  it("flags new and removed cases", () => {
    const previous = buildBaseline("suite", [{ caseId: "a", evalComposite: 85 }], "v1");
    const current = buildBaseline("suite", [{ caseId: "b", evalComposite: 85 }], "v2");

    const report = compareBaselines(current, previous);

    expect(report.newCases).toHaveLength(1);
    expect(report.removedCases).toHaveLength(1);
    expect(report.newCases[0]?.caseId).toBe("b");
    expect(report.removedCases[0]?.caseId).toBe("a");
  });

  it("supports configurable thresholds", () => {
    const previous = buildBaseline("suite", [{ caseId: "a", evalComposite: 90 }], "v1");
    const current = buildBaseline("suite", [{ caseId: "a", evalComposite: 85 }], "v2");

    const report = compareBaselines(current, previous, { regressionThreshold: 10 });

    expect(report.regressions).toHaveLength(0);
    expect(report.warnings).toHaveLength(1);
  });
});
