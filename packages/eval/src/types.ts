import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import type { CriticFinding } from "@my-ai-orchestrator/text-quality";

export type QualityMode = "fast" | "balanced" | "strict";

export type ScoringLayer = "deterministic" | "heuristic" | "judge";

export interface VoiceProfileFixtureReference {
  readonly type: "fixture";
  readonly path: string;
}

export type EvalVoiceProfile = TextQualityVoiceProfile | VoiceProfileFixtureReference;

export interface EvalExpectations {
  readonly mustContain?: readonly string[];
  readonly mustNotContain?: readonly string[];
  readonly wordCountRange?: { readonly min: number; readonly max: number };
  readonly tone?: "formal" | "informal" | "neutral";
  readonly minVoiceScore?: number;
  readonly minDriftScore?: number;
  readonly minDevelopmentDriftScore?: number;
  readonly mustTriggerCritic?: readonly string[];
  readonly maxCriticScore?: number;
}

export interface BaseEvalCase {
  readonly id: string;
  readonly suite: string;
  readonly tags: readonly string[];
  readonly expectations: EvalExpectations;
}

export interface VoiceFidelityEvalCase extends BaseEvalCase {
  readonly suite: "voice-fidelity";
  readonly input: {
    readonly contentType: string;
    readonly briefing: string;
    readonly voiceProfile: EvalVoiceProfile;
    readonly qualityMode: QualityMode;
  };
}

export interface DriftRegressionEvalCase extends BaseEvalCase {
  readonly suite: "drift-regression";
  readonly input: {
    readonly voiceProfile: EvalVoiceProfile;
    readonly candidate: string;
    readonly stepName?: string;
  };
}

export interface CriticRegressionEvalCase extends BaseEvalCase {
  readonly suite: "critic-regression";
  readonly input: {
    readonly text: string;
  };
}

export type EvalCase = VoiceFidelityEvalCase | DriftRegressionEvalCase | CriticRegressionEvalCase;

export interface DeterministicCheck {
  readonly name: string;
  readonly passed: boolean;
  readonly message: string;
}

export interface DeterministicScore {
  readonly score: number;
  readonly checks: readonly DeterministicCheck[];
}

export interface HeuristicSubScores {
  readonly critic: number;
  readonly fidelity: number;
  readonly drift: number;
  readonly developmentDrift?: number;
  readonly lexical?: number;
}

export interface HeuristicScore {
  readonly score: number;
  readonly subScores: HeuristicSubScores;
  readonly findings?: readonly CriticFinding[];
}

export interface JudgeScore {
  readonly score: number;
  readonly rationale: string;
  readonly provider: string;
  readonly model?: string;
}

export interface EvalLayerScores {
  readonly deterministic: number;
  readonly heuristic: number;
  readonly judge?: number;
  readonly evalComposite: number;
}

export interface EvalResult {
  readonly caseId: string;
  readonly suite: string;
  readonly text: string;
  readonly scores: EvalLayerScores;
  readonly deterministic: DeterministicScore;
  readonly heuristic: HeuristicScore;
  readonly judge?: JudgeScore;
  readonly passed: boolean;
  readonly error?: string;
  readonly durationMs: number;
}

export interface EvalSuite {
  readonly name: string;
  readonly description?: string;
  readonly cases: readonly EvalCase[];
}

export interface EvalBaselineResult {
  readonly caseId: string;
  readonly scores: EvalLayerScores;
}

export interface RegressionEntry {
  readonly caseId: string;
  readonly previousScore: number;
  readonly currentScore: number;
  readonly delta: number;
}

export interface EvalBaselineSummary {
  readonly avgEvalComposite: number;
  readonly minEvalComposite: number;
  readonly passRate: number;
  readonly regressions: readonly RegressionEntry[];
}

export interface EvalBaseline {
  readonly version: string;
  readonly timestamp: string;
  readonly suite: string;
  readonly results: readonly EvalBaselineResult[];
  readonly summary: EvalBaselineSummary;
}

export type DeltaClassification = "improvement" | "stable" | "warning" | "regression" | "new" | "removed";

export interface CaseDelta {
  readonly caseId: string;
  readonly previousScore?: number;
  readonly currentScore?: number;
  readonly delta: number;
  readonly classification: DeltaClassification;
}

export interface RegressionReport {
  readonly currentVersion: string;
  readonly previousVersion?: string;
  readonly regressions: readonly CaseDelta[];
  readonly warnings: readonly CaseDelta[];
  readonly improvements: readonly CaseDelta[];
  readonly stable: readonly CaseDelta[];
  readonly newCases: readonly CaseDelta[];
  readonly removedCases: readonly CaseDelta[];
  readonly summary: {
    readonly regressionCount: number;
    readonly warningCount: number;
    readonly improvementCount: number;
    readonly stableCount: number;
    readonly newCaseCount: number;
    readonly removedCaseCount: number;
  };
}

export interface EvalWeights {
  readonly deterministic: number;
  readonly heuristic: number;
  readonly judge: number;
}

export interface EvalConfig {
  readonly suite?: string;
  readonly tags?: readonly string[];
  readonly caseId?: string;
  readonly includeJudge: boolean;
  readonly compare: boolean;
  readonly saveBaseline: boolean;
  readonly reportFormat: "console" | "json" | "markdown";
  readonly threshold: number;
}

export interface EvalSuiteSummary {
  readonly name: string;
  readonly caseCount: number;
  readonly passedCount: number;
  readonly avgEvalComposite: number;
  readonly minEvalComposite: number;
  readonly passRate: number;
}

export interface EvalReport {
  readonly timestamp: string;
  readonly version?: string;
  readonly durationMs: number;
  readonly config: EvalConfig;
  readonly suites: readonly EvalSuiteSummary[];
  readonly results: readonly EvalResult[];
  readonly baselineComparison?: RegressionReport;
}

export interface EvalRunConfig {
  readonly cases: readonly EvalCase[];
  readonly generate: (evalCase: EvalCase, voiceProfile: TextQualityVoiceProfile | undefined) => Promise<string>;
  readonly resolveVoiceProfile: (voiceProfile: EvalVoiceProfile) => Promise<TextQualityVoiceProfile>;
  readonly includeJudge: boolean;
  readonly scoreJudge?: (text: string, voiceProfile: TextQualityVoiceProfile) => Promise<JudgeScore | null>;
  readonly weights?: EvalWeights;
  readonly onProgress?: (result: EvalResult) => void | Promise<void>;
}
