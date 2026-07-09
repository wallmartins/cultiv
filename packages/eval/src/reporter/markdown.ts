import type { EvalReport, EvalResult, EvalSuiteSummary, RegressionReport } from "../types.js";

export function reportMarkdown(report: EvalReport): string {
  const lines: string[] = [];

  lines.push("# Eval Report");
  lines.push("");

  const overallScore = computeOverallScore(report);
  const statusEmoji = computeStatusEmoji(report);
  const regressionCount = report.baselineComparison?.regressions.length ?? 0;

  lines.push(`${statusEmoji} **Overall score:** ${overallScore}`);
  lines.push(`📊 **Suites:** ${report.suites.length}`);
  lines.push(`⏱️ **Duration:** ${report.durationMs}ms`);
  lines.push(`🕒 **Timestamp:** ${report.timestamp}`);
  if (report.version) {
    lines.push(`🔖 **Version:** ${report.version}`);
  }
  if (report.baselineComparison) {
    lines.push(`📉 **Regressions:** ${regressionCount}`);
  }
  lines.push("");

  if (report.suites.length > 0) {
    lines.push("## Suite Summaries");
    lines.push("");
    lines.push("| Suite | Cases | Passed | Avg | Min | Pass Rate |");
    lines.push("|-------|-------|--------|-----|-----|-----------|");

    for (const suite of report.suites) {
      lines.push(formatSuiteSummaryRow(suite));
    }

    lines.push("");
  }

  if (report.results.length > 0) {
    lines.push("## Per-Case Results");
    lines.push("");
    lines.push("| Case | Suite | Composite | Deterministic | Heuristic | Judge | Status |");
    lines.push("|------|-------|-----------|---------------|-----------|-------|--------|");

    for (const result of report.results) {
      lines.push(formatResultRow(result));
    }

    lines.push("");
  }

  if (report.baselineComparison) {
    lines.push(...formatBaselineComparison(report.baselineComparison));
  }

  lines.push("## Configuration");
  lines.push("");
  lines.push("| Option | Value |");
  lines.push("|--------|-------|");
  lines.push(`| includeJudge | ${report.config.includeJudge} |`);
  lines.push(`| compare | ${report.config.compare} |`);
  lines.push(`| saveBaseline | ${report.config.saveBaseline} |`);
  lines.push(`| reportFormat | ${report.config.reportFormat} |`);
  lines.push(`| threshold | ${report.config.threshold} |`);
  lines.push("");

  return lines.join("\n");
}

function computeOverallScore(report: EvalReport): number {
  if (report.results.length === 0) {
    return 0;
  }

  const total = report.results.reduce((sum, result) => sum + result.scores.evalComposite, 0);
  return Math.round(total / report.results.length);
}

function computeStatusEmoji(report: EvalReport): string {
  const regressionCount = report.baselineComparison?.regressions.length ?? 0;

  if (regressionCount > 0) {
    return "❌";
  }

  const warningCount = report.baselineComparison?.warnings.length ?? 0;
  if (warningCount > 0) {
    return "⚠️";
  }

  if (report.results.length === 0) {
    return "⚪";
  }

  return "✅";
}

function formatSuiteSummaryRow(suite: EvalSuiteSummary): string {
  return `| ${suite.name} | ${suite.caseCount} | ${suite.passedCount} | ${suite.avgEvalComposite} | ${suite.minEvalComposite} | ${suite.passRate}% |`;
}

function formatResultRow(result: EvalResult): string {
  const statusEmoji = result.passed ? "✅" : "❌";
  const judgeScore = result.scores.judge !== undefined ? String(result.scores.judge) : "-";

  return `| ${result.caseId} | ${result.suite} | ${result.scores.evalComposite} | ${result.scores.deterministic} | ${result.scores.heuristic} | ${judgeScore} | ${statusEmoji} |`;
}

function formatBaselineComparison(comparison: RegressionReport): string[] {
  const lines: string[] = [];

  lines.push("## Baseline Comparison");
  lines.push("");
  lines.push(`Comparing **${comparison.currentVersion}** against **${comparison.previousVersion ?? "unknown"}**.`);
  lines.push("");

  if (comparison.regressions.length > 0) {
    lines.push("### Regressions");
    lines.push("");
    lines.push("| Case | Previous | Current | Delta |");
    lines.push("|------|----------|---------|-------|");

    for (const delta of comparison.regressions) {
      lines.push(formatDeltaRow(delta));
    }

    lines.push("");
  }

  if (comparison.warnings.length > 0) {
    lines.push("### Warnings");
    lines.push("");
    lines.push("| Case | Previous | Current | Delta |");
    lines.push("|------|----------|---------|-------|");

    for (const delta of comparison.warnings) {
      lines.push(formatDeltaRow(delta));
    }

    lines.push("");
  }

  if (comparison.improvements.length > 0) {
    lines.push("### Improvements");
    lines.push("");
    lines.push("| Case | Previous | Current | Delta |");
    lines.push("|------|----------|---------|-------|");

    for (const delta of comparison.improvements) {
      lines.push(formatDeltaRow(delta));
    }

    lines.push("");
  }

  lines.push("### Summary");
  lines.push("");
  lines.push(`- Regressions: ${comparison.summary.regressionCount}`);
  lines.push(`- Warnings: ${comparison.summary.warningCount}`);
  lines.push(`- Improvements: ${comparison.summary.improvementCount}`);
  lines.push(`- Stable: ${comparison.summary.stableCount}`);
  lines.push(`- New cases: ${comparison.summary.newCaseCount}`);
  lines.push(`- Removed cases: ${comparison.summary.removedCaseCount}`);
  lines.push("");

  return lines;
}

function formatDeltaRow(delta: { readonly caseId: string; readonly previousScore?: number; readonly currentScore?: number; readonly delta: number }): string {
  const previous = delta.previousScore !== undefined ? String(delta.previousScore) : "-";
  const current = delta.currentScore !== undefined ? String(delta.currentScore) : "-";

  return `| ${delta.caseId} | ${previous} | ${current} | ${delta.delta} |`;
}
