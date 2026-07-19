import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import { compareBaselines, getLatestBaseline, saveBaseline } from "../baseline.js";
import { createOrchestratorGenerator } from "../generator/orchestrator.js";
import { createPlaceholderGenerator } from "../generator/placeholder.js";
import type { GeneratorAdapter } from "../generator/types.js";
import { loadFixtures } from "../fixtures/loader.js";
import { reportJSON } from "../reporter/json.js";
import { reportMarkdown } from "../reporter/markdown.js";
import { runEvalSuite } from "../runner.js";
import { createJudgeAdapter } from "../scorer/judge-adapter.js";
import { scoreWithJudge } from "../scorer/judge.js";
import type { EvalCase, EvalReport, EvalRunConfig, EvalVoiceProfile } from "../types.js";
import { CLIArgumentError, type EvalCLIConfig, parseArgs, renderHelp, renderVersion } from "./args.js";

const PACKAGE_ROOT = resolve(import.meta.dirname, "../..");

export async function main(argv: readonly string[]): Promise<number> {
  try {
    const config = parseArgs(argv);

    if (config.help) {
      console.log(renderHelp());
      return 0;
    }

    if (config.version) {
      console.log(renderVersion());
      return 0;
    }

    const cases = loadFixtures({
      suite: config.suite,
      tags: config.tags,
      caseId: config.caseId
    });

    if (cases.length === 0) {
      console.log("No eval cases matched the requested filters.");
      return 0;
    }

    const runConfig: EvalRunConfig = {
      cases,
      generate: createGenerator(config.generator).generate,
      resolveVoiceProfile: resolveVoiceProfileReference,
      includeJudge: config.includeJudge,
      scoreJudge: config.includeJudge ? createJudgeScorer(config) : undefined,
      onProgress: (result) => {
        const status = result.passed ? "✅" : "❌";
        console.log(`${status} ${result.caseId} (${result.suite}) — composite ${result.scores.evalComposite}`);
      }
    };

    console.log(`Running ${cases.length} eval case(s)...`);
    const report = await runEvalSuite(runConfig);

    let finalReport = report;

    if (config.compare) {
      const suiteNames = new Set(report.results.map((r) => r.suite));
      let comparisonReport = report;

      for (const suite of suiteNames) {
        const previous = getLatestBaseline(suite);
        if (!previous) {
          console.log(`No previous baseline found for ${suite}; skipping comparison.`);
          continue;
        }

        const currentBaseline = {
          version: report.version ?? "current",
          timestamp: report.timestamp,
          suite,
          results: report.results.filter((r) => r.suite === suite).map((r) => ({
            caseId: r.caseId,
            scores: r.scores
          })),
          summary: {
            avgEvalComposite: 0,
            minEvalComposite: 0,
            passRate: 0,
            regressions: []
          }
        };

        const comparison = compareBaselines(currentBaseline, previous, { regressionThreshold: config.threshold });
        comparisonReport = {
          ...comparisonReport,
          baselineComparison: comparisonReport.baselineComparison
            ? mergeComparisons(comparisonReport.baselineComparison, comparison)
            : comparison
        };
      }

      finalReport = comparisonReport;
    }

    if (config.saveBaseline) {
      const saved = saveBaseline(finalReport, finalReport.version ?? "current");
      console.log(`Saved baselines for ${saved.map((b) => b.suite).join(", ")}.`);
    }

    outputReport(finalReport, config.reportFormat);

    if (config.compare && finalReport.baselineComparison) {
      return finalReport.baselineComparison.regressions.length > 0 ? 1 : 0;
    }

    return 0;
  } catch (error) {
    if (error instanceof CLIArgumentError) {
      console.error(`Argument error: ${error.message}`);
      console.error(renderHelp());
      return 1;
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error(`Eval failed: ${message}`);
    return 1;
  }
}

function createGenerator(generator: "placeholder" | "orchestrator"): GeneratorAdapter {
  if (generator === "orchestrator") {
    return createOrchestratorGenerator({
      provider: process.env.EVAL_GENERATION_PROVIDER,
      model: process.env.EVAL_GENERATION_MODEL,
      apiKey: process.env.EVAL_GENERATION_API_KEY
    });
  }

  return createPlaceholderGenerator();
}

function createJudgeScorer(config: EvalCLIConfig): NonNullable<EvalRunConfig["scoreJudge"]> {
  const adapter = createJudgeAdapter({
    provider: config.judgeProvider,
    model: config.judgeModel
  });

  return async (text, voiceProfile) => scoreWithJudge(text, voiceProfile, adapter);
}

function resolveVoiceProfileReference(voiceProfile: EvalVoiceProfile): Promise<TextQualityVoiceProfile> {
  if (isVoiceProfileReference(voiceProfile)) {
    const filePath = resolve(PACKAGE_ROOT, "src", "fixtures", voiceProfile.path);
    const content = readFileSync(filePath, "utf8");
    return Promise.resolve(JSON.parse(content) as TextQualityVoiceProfile);
  }

  return Promise.resolve(voiceProfile);
}

function isVoiceProfileReference(voiceProfile: EvalVoiceProfile): voiceProfile is { readonly type: "fixture"; readonly path: string } {
  return "type" in voiceProfile && voiceProfile.type === "fixture" && "path" in voiceProfile;
}

function outputReport(report: EvalReport, format: "console" | "json" | "markdown"): void {
  if (format === "json") {
    const output = reportJSON(report);
    console.log(output);
    writeReportArtifact(output, "eval-report.json");
    return;
  }

  if (format === "markdown") {
    console.log(reportMarkdown(report));
    return;
  }

  console.log("\n=== Eval Report ===");
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Duration: ${report.durationMs}ms`);
  console.log(`Cases: ${report.results.length}`);

  for (const suite of report.suites) {
    console.log(`\n[${suite.name}] ${suite.passedCount}/${suite.caseCount} passed — avg ${suite.avgEvalComposite}, min ${suite.minEvalComposite}`);

    for (const result of report.results.filter((r) => r.suite === suite.name)) {
      const status = result.passed ? "PASS" : "FAIL";
      console.log(`  ${status} ${result.caseId}: ${result.scores.evalComposite} (D:${result.scores.deterministic} H:${result.scores.heuristic}${result.scores.judge !== undefined ? ` J:${result.scores.judge}` : ""})`);
    }
  }

  if (report.baselineComparison) {
    console.log("\n=== Baseline Comparison ===");
    console.log(`Regressions: ${report.baselineComparison.regressions.length}`);
    console.log(`Warnings: ${report.baselineComparison.warnings.length}`);
    console.log(`Improvements: ${report.baselineComparison.improvements.length}`);
  }
}

function writeReportArtifact(content: string, fileName: string): void {
  const artifactDir = resolve(PACKAGE_ROOT, "dist");
  if (!existsSync(artifactDir)) {
    mkdirSync(artifactDir, { recursive: true });
  }
  writeFileSync(resolve(artifactDir, fileName), content);
}

function mergeComparisons(a: NonNullable<EvalReport["baselineComparison"]>, b: NonNullable<EvalReport["baselineComparison"]>) {
  return {
    currentVersion: a.currentVersion,
    previousVersion: a.previousVersion,
    regressions: [...a.regressions, ...b.regressions],
    warnings: [...a.warnings, ...b.warnings],
    improvements: [...a.improvements, ...b.improvements],
    stable: [...a.stable, ...b.stable],
    newCases: [...a.newCases, ...b.newCases],
    removedCases: [...a.removedCases, ...b.removedCases],
    summary: {
      regressionCount: a.summary.regressionCount + b.summary.regressionCount,
      warningCount: a.summary.warningCount + b.summary.warningCount,
      improvementCount: a.summary.improvementCount + b.summary.improvementCount,
      stableCount: a.summary.stableCount + b.summary.stableCount,
      newCaseCount: a.summary.newCaseCount + b.summary.newCaseCount,
      removedCaseCount: a.summary.removedCaseCount + b.summary.removedCaseCount
    }
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv).then((exitCode) => {
    process.exit(exitCode);
  });
}
