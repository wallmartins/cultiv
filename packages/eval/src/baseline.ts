import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CaseDelta, DeltaClassification, EvalBaseline, EvalBaselineResult, EvalReport, RegressionReport } from "./types.js";

const DEFAULT_BASELINE_ROOT = resolve(import.meta.dirname, "../../../tests/eval/baselines");

export interface BaselineEntry {
  readonly version: string;
  readonly timestamp: string;
}

export interface CompareBaselinesOptions {
  readonly regressionThreshold?: number;
  readonly warningThreshold?: number;
  readonly improvementThreshold?: number;
}

export function saveBaseline(
  report: EvalReport,
  version: string,
  baselineRoot: string = DEFAULT_BASELINE_ROOT
): EvalBaseline[] {
  const bySuite = groupResultsBySuite(report);
  const saved: EvalBaseline[] = [];

  for (const [suite, results] of bySuite.entries()) {
    const baseline = buildBaseline(suite, results, version, report.timestamp);
    const suiteDir = resolve(baselineRoot, suite);

    if (!existsSync(suiteDir)) {
      mkdirSync(suiteDir, { recursive: true });
    }

    const filePath = resolve(suiteDir, `${version}.json`);
    writeFileSync(filePath, JSON.stringify(baseline, null, 2) + "\n");
    saved.push(baseline);
  }

  return saved;
}

export function loadBaseline(
  suite: string,
  version: string,
  baselineRoot: string = DEFAULT_BASELINE_ROOT
): EvalBaseline | null {
  const filePath = resolve(baselineRoot, suite, `${version}.json`);

  if (!existsSync(filePath)) {
    return null;
  }

  return parseBaselineFile(filePath);
}

export function loadLatestBaseline(
  suite: string,
  baselineRoot: string = DEFAULT_BASELINE_ROOT
): EvalBaseline | null {
  const entries = listBaselines(suite, baselineRoot);

  if (entries.length === 0) {
    return null;
  }

  const latest = entries[0];
  return loadBaseline(suite, latest.version, baselineRoot);
}

export function listBaselines(
  suite: string,
  baselineRoot: string = DEFAULT_BASELINE_ROOT
): BaselineEntry[] {
  const suiteDir = resolve(baselineRoot, suite);

  if (!existsSync(suiteDir)) {
    return [];
  }

  return readdirSync(suiteDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const filePath = resolve(suiteDir, file);
      const baseline = parseBaselineFile(filePath);
      return { version: baseline.version, timestamp: baseline.timestamp };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getLatestBaseline(
  suite: string,
  baselineRoot: string = DEFAULT_BASELINE_ROOT
): EvalBaseline | null {
  return loadLatestBaseline(suite, baselineRoot);
}

function groupResultsBySuite(report: EvalReport): Map<string, EvalBaselineResult[]> {
  const groups = new Map<string, EvalBaselineResult[]>();

  for (const result of report.results) {
    const entry: EvalBaselineResult = {
      caseId: result.caseId,
      scores: result.scores
    };

    const group = groups.get(result.suite) ?? [];
    group.push(entry);
    groups.set(result.suite, group);
  }

  return groups;
}

function buildBaseline(
  suite: string,
  results: EvalBaselineResult[],
  version: string,
  timestamp: string
): EvalBaseline {
  const composites = results.map((r) => r.scores.evalComposite);
  const avgEvalComposite = composites.length === 0
    ? 0
    : Math.round(composites.reduce((a, b) => a + b, 0) / composites.length);
  const minEvalComposite = composites.length === 0 ? 0 : Math.min(...composites);
  const passedCount = results.filter((r) => r.scores.evalComposite >= 70).length;
  const passRate = results.length === 0 ? 0 : Math.round((passedCount / results.length) * 100);

  return {
    version,
    timestamp,
    suite,
    results,
    summary: {
      avgEvalComposite,
      minEvalComposite,
      passRate,
      regressions: []
    }
  };
}

function parseBaselineFile(filePath: string): EvalBaseline {
  const content = readFileSync(filePath, "utf8");
  return JSON.parse(content) as EvalBaseline;
}

export function compareBaselines(
  current: EvalBaseline,
  previous: EvalBaseline,
  options: CompareBaselinesOptions = {}
): RegressionReport {
  const regressionThreshold = options.regressionThreshold ?? 5;
  const warningThreshold = options.warningThreshold ?? 2;
  const improvementThreshold = options.improvementThreshold ?? 3;

  const currentScores = new Map(current.results.map((r) => [r.caseId, r.scores.evalComposite]));
  const previousScores = new Map(previous.results.map((r) => [r.caseId, r.scores.evalComposite]));

  const allCaseIds = new Set([...currentScores.keys(), ...previousScores.keys()]);

  const regressions: CaseDelta[] = [];
  const warnings: CaseDelta[] = [];
  const improvements: CaseDelta[] = [];
  const stable: CaseDelta[] = [];
  const newCases: CaseDelta[] = [];
  const removedCases: CaseDelta[] = [];

  for (const caseId of allCaseIds) {
    const currentScore = currentScores.get(caseId);
    const previousScore = previousScores.get(caseId);

    if (currentScore === undefined) {
      removedCases.push({
        caseId,
        previousScore,
        delta: 0,
        classification: "removed"
      });
      continue;
    }

    if (previousScore === undefined) {
      newCases.push({
        caseId,
        currentScore,
        delta: 0,
        classification: "new"
      });
      continue;
    }

    const delta = currentScore - previousScore;
    const classification = classifyDelta(delta, regressionThreshold, warningThreshold, improvementThreshold);
    const caseDelta: CaseDelta = {
      caseId,
      previousScore,
      currentScore,
      delta,
      classification
    };

    if (classification === "regression") regressions.push(caseDelta);
    else if (classification === "warning") warnings.push(caseDelta);
    else if (classification === "improvement") improvements.push(caseDelta);
    else stable.push(caseDelta);
  }

  return {
    currentVersion: current.version,
    previousVersion: previous.version,
    regressions,
    warnings,
    improvements,
    stable,
    newCases,
    removedCases,
    summary: {
      regressionCount: regressions.length,
      warningCount: warnings.length,
      improvementCount: improvements.length,
      stableCount: stable.length,
      newCaseCount: newCases.length,
      removedCaseCount: removedCases.length
    }
  };
}

function classifyDelta(
  delta: number,
  regressionThreshold: number,
  warningThreshold: number,
  improvementThreshold: number
): DeltaClassification {
  if (delta < -regressionThreshold) return "regression";
  if (delta < -warningThreshold) return "warning";
  if (delta > improvementThreshold) return "improvement";
  return "stable";
}
