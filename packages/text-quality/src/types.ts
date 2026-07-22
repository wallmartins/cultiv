import type { Effect } from "effect";
import type { PipelineRequest, TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import type { GenerationContext } from "./format/generation-context.js";

export type VoiceProfile = TextQualityVoiceProfile;

export type QualityLaneStrategy = "conservative" | "balanced" | "creative";

export interface QualityLane {
  readonly laneId: string;
  readonly adapter: string;
  readonly model: string;
  readonly temperature: number;
  readonly strategy: QualityLaneStrategy;
  readonly generate: (context: TextQualityContext) => Effect.Effect<string, import("./errors.js").TextQualityError>;
}

export interface LaneProgress {
  readonly laneId: string;
  readonly stage: "draft" | "critic" | "fidelity" | "drift" | "humanize" | "refine" | "score";
  readonly percent: number;
  readonly message?: string;
}

export interface TextQualityContext {
  readonly request: PipelineRequest;
  readonly userId: string;
  readonly briefing: string;
  readonly voiceProfile: VoiceProfile;
  readonly now: () => Date;
  readonly generationContext?: GenerationContext;
  readonly lexicalQualityV2?: boolean;
}

export const DEFAULT_LANE_CONCURRENCY_CAP = 3;

export interface TextQualityRequest {
  readonly request: PipelineRequest;
  readonly userId: string;
  readonly briefing: string;
  readonly lanes: readonly QualityLane[];
  readonly now: () => Date;
  readonly voiceHints?: Partial<VoiceProfile>;
  readonly generationContext?: GenerationContext;
  readonly lexicalQualityV2?: boolean;
  readonly reasoningEvaluationEnabled?: boolean;
  readonly laneConcurrencyCap?: number;
  readonly onLaneProgress?: (progress: LaneProgress) => Effect.Effect<void>;
}

export interface VoiceProfileResolutionInput {
  readonly request: PipelineRequest;
  readonly userId: string;
  readonly briefing: string;
  readonly voiceHints?: Partial<VoiceProfile>;
}

export interface CriticFinding {
  readonly type:
    | "generic"
    | "performative"
    | "cliche"
    | "redundant"
    | "llmish"
    | "premature_conclusion"
    | "excess_certainty"
    | "rhetorical_inflation"
    | "structural_premature_thesis"
    | "structural_advocacy_arc"
    | "structural_anti_pattern_hit"
    | "metaphor_repetition"
    | "metaphor_domain_leak";
  readonly severity: "low" | "medium" | "high";
  readonly message: string;
}

export interface CriticResult {
  readonly findings: readonly CriticFinding[];
  readonly score: number;
}

export interface FidelityResult {
  readonly passed: boolean;
  readonly score: number;
  readonly notes: readonly string[];
}

export interface VoiceDriftResult {
  readonly score: number;
  readonly notes: readonly string[];
  readonly reasoningScore?: number;
  readonly developmentScore?: number;
  readonly surfaceScore?: number;
}

export interface CandidateScoreBreakdown {
  readonly criticScore: number;
  readonly fidelityScore: number;
  readonly driftScore: number;
  readonly reasoningDriftScore?: number;
  readonly developmentDriftScore?: number;
  readonly strategyBonus: number;
  readonly finalScore: number;
}

export interface CandidateText {
  readonly laneId: string;
  readonly draft: string;
  readonly humanizedDraft: string;
  readonly refinedDraft: string;
  readonly critic: CriticResult;
  readonly fidelity: FidelityResult;
  readonly drift: VoiceDriftResult;
  readonly score: CandidateScoreBreakdown;
  readonly lexicalPenalty?: number;
  readonly traceId?: string;
}

export interface CandidateSelectionContext {
  readonly request: PipelineRequest;
  readonly briefing: string;
  readonly voiceProfile: VoiceProfile;
  readonly generationContext?: GenerationContext;
  readonly lexicalQualityV2?: boolean;
}

export interface TextQualityResult {
  readonly output: string;
  readonly bestCandidate: CandidateText;
  readonly candidates: readonly CandidateText[];
  readonly voiceProfile: VoiceProfile;
  readonly traceId?: string;
}

export interface VoiceMemoryRecord {
  readonly userId: string;
  readonly key: string;
  readonly value: unknown;
}
