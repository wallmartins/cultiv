import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import type {
  EvalCase,
  EvalConfig,
  EvalReport,
  EvalResult,
  EvalRunConfig,
  EvalSuiteSummary,
  EvalVoiceProfile,
  EvalWeights,
  HeuristicScore
} from "./types.js";
import { scoreDeterministic } from "./scorer/deterministic.js";
import { scoreHeuristic } from "./scorer/heuristic.js";

const DEFAULT_WEIGHTS: EvalWeights = {
  deterministic: 0.3,
  heuristic: 0.5,
  judge: 0.2
};

const DEFAULT_WEIGHTS_WITHOUT_JUDGE: EvalWeights = {
  deterministic: 0.4,
  heuristic: 0.6,
  judge: 0
};

export async function runEvalSuite(config: EvalRunConfig): Promise<EvalReport> {
  const startedAt = Date.now();
  const results: EvalResult[] = [];

  for (const evalCase of config.cases) {
    const result = await runEvalCase(evalCase, config);
    results.push(result);

    if (config.onProgress) {
      await config.onProgress(result);
    }
  }

  const durationMs = Date.now() - startedAt;

  return {
    timestamp: new Date(startedAt).toISOString(),
    durationMs,
    config: buildEvalConfig(config),
    suites: buildSuiteSummaries(results),
    results
  };
}

async function runEvalCase(evalCase: EvalCase, config: EvalRunConfig): Promise<EvalResult> {
  const startedAt = Date.now();

  try {
    const voiceProfile = await resolveVoiceProfileForCase(evalCase, config.resolveVoiceProfile);
    const text = await resolveText(evalCase, config.generate, voiceProfile);
    const reference = getReferenceBriefing(evalCase);

    const deterministic = scoreDeterministic(text, evalCase.expectations);
    const heuristic = scoreHeuristic(text, voiceProfile, {
      reference,
      stepName: getStepName(evalCase),
      quantitativeSignals: voiceProfile?.quantitativeSignals
    });

    const judge = config.includeJudge && voiceProfile && config.scoreJudge
      ? await config.scoreJudge(text, voiceProfile)
      : undefined;

    const scores = computeLayerScores(deterministic.score, heuristic.score, judge?.score, config.weights);
    const passed = evaluatePass(evalCase, deterministic.score, heuristic, judge?.score);

    return {
      caseId: evalCase.id,
      suite: evalCase.suite,
      text,
      scores,
      deterministic,
      heuristic,
      judge: judge ?? undefined,
      passed,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      caseId: evalCase.id,
      suite: evalCase.suite,
      text: "",
      scores: {
        deterministic: 0,
        heuristic: 0,
        evalComposite: 0
      },
      deterministic: { score: 0, checks: [] },
      heuristic: { score: 0, subScores: { critic: 0, fidelity: 0, drift: 0 } },
      passed: false,
      error: message,
      durationMs: Date.now() - startedAt
    };
  }
}

async function resolveText(
  evalCase: EvalCase,
  generate: EvalRunConfig["generate"],
  voiceProfile: TextQualityVoiceProfile | undefined
): Promise<string> {
  if (evalCase.suite === "voice-fidelity") {
    return generate(evalCase, voiceProfile);
  }

  if (evalCase.suite === "drift-regression") {
    return evalCase.input.candidate;
  }

  return evalCase.input.text;
}

async function resolveVoiceProfileForCase(
  evalCase: EvalCase,
  resolver: EvalRunConfig["resolveVoiceProfile"]
): Promise<TextQualityVoiceProfile | undefined> {
  const voiceProfile = getVoiceProfile(evalCase);

  if (!voiceProfile) {
    return undefined;
  }

  return resolver(voiceProfile);
}

function getVoiceProfile(evalCase: EvalCase): EvalVoiceProfile | undefined {
  if (evalCase.suite === "voice-fidelity") {
    return evalCase.input.voiceProfile;
  }

  if (evalCase.suite === "drift-regression") {
    return evalCase.input.voiceProfile;
  }

  return undefined;
}

function getReferenceBriefing(evalCase: EvalCase): string | undefined {
  if (evalCase.suite === "voice-fidelity") {
    return evalCase.input.briefing;
  }

  return undefined;
}

function getStepName(evalCase: EvalCase): string | undefined {
  if (evalCase.suite === "drift-regression") {
    return evalCase.input.stepName;
  }

  return undefined;
}

function computeLayerScores(
  deterministicScore: number,
  heuristicScore: number,
  judgeScore: number | undefined,
  customWeights?: EvalWeights
): EvalResult["scores"] {
  const hasJudge = typeof judgeScore === "number";
  const weights = customWeights ?? (hasJudge ? DEFAULT_WEIGHTS : DEFAULT_WEIGHTS_WITHOUT_JUDGE);

  const normalizedWeights = hasJudge
    ? normalizeWeights(weights)
    : normalizeWeights({ deterministic: weights.deterministic, heuristic: weights.heuristic, judge: 0 });

  const judgeContribution = hasJudge ? (judgeScore ?? 0) * normalizedWeights.judge : 0;

  const evalComposite = Math.round(
    deterministicScore * normalizedWeights.deterministic +
    heuristicScore * normalizedWeights.heuristic +
    judgeContribution
  );

  return {
    deterministic: deterministicScore,
    heuristic: heuristicScore,
    judge: judgeScore,
    evalComposite
  };
}

function normalizeWeights(weights: EvalWeights): EvalWeights {
  const total = weights.deterministic + weights.heuristic + weights.judge;

  if (total === 0) {
    return { deterministic: 0.5, heuristic: 0.5, judge: 0 };
  }

  return {
    deterministic: weights.deterministic / total,
    heuristic: weights.heuristic / total,
    judge: weights.judge / total
  };
}

function evaluatePass(
  evalCase: EvalCase,
  deterministicScore: number,
  heuristic: HeuristicScore,
  judgeScore: number | undefined
): boolean {
  const expectations = evalCase.expectations;

  if (deterministicScore < 100) {
    return false;
  }

  if (expectations.minDriftScore !== undefined && heuristic.subScores.drift < expectations.minDriftScore) {
    return false;
  }

  if (
    expectations.minDevelopmentDriftScore !== undefined &&
    (heuristic.subScores.developmentDrift ?? 100) < expectations.minDevelopmentDriftScore
  ) {
    return false;
  }

  if (expectations.maxCriticScore !== undefined && heuristic.subScores.critic > expectations.maxCriticScore) {
    return false;
  }

  if (expectations.mustTriggerCritic !== undefined && expectations.mustTriggerCritic.length > 0) {
    const triggeredTypes = new Set(heuristic.findings?.map((finding) => String(finding.type)) ?? []);
    const allTriggered = expectations.mustTriggerCritic.every((type) => triggeredTypes.has(type));
    if (!allTriggered) {
      return false;
    }
  }

  if (expectations.minVoiceScore !== undefined && (judgeScore ?? 0) < expectations.minVoiceScore) {
    return false;
  }

  return true;
}

function buildEvalConfig(config: EvalRunConfig): EvalConfig {
  return {
    includeJudge: config.includeJudge,
    compare: false,
    saveBaseline: false,
    reportFormat: "console",
    threshold: 5
  };
}

function buildSuiteSummaries(results: readonly EvalResult[]): EvalSuiteSummary[] {
  const bySuite = new Map<string, EvalResult[]>();

  for (const result of results) {
    const group = bySuite.get(result.suite) ?? [];
    group.push(result);
    bySuite.set(result.suite, group);
  }

  return Array.from(bySuite.entries())
    .map(([name, suiteResults]) => {
      const composites = suiteResults.map((r) => r.scores.evalComposite);
      const passedCount = suiteResults.filter((r) => r.passed).length;

      return {
        name,
        caseCount: suiteResults.length,
        passedCount,
        avgEvalComposite: Math.round(composites.reduce((a, b) => a + b, 0) / composites.length),
        minEvalComposite: Math.min(...composites),
        passRate: Math.round((passedCount / suiteResults.length) * 100)
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
