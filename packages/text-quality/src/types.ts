import type { Effect } from "effect";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import type { GenerationContext } from "./domain/generation-context.js";

export type VoiceProfile = {
  readonly userId: string;
  readonly tone: string;
  readonly cadence: string;
  readonly description?: string;
  readonly lexicon: readonly string[];
  readonly constraints: readonly string[];
  readonly examples: readonly string[];
  readonly antiPatterns: readonly string[];
  readonly antiPatternsExplicit: readonly string[];
  readonly rules: readonly string[];
  readonly styleMarkers: readonly string[];
  readonly userLabels: readonly string[];
};

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

export interface TextQualityRequest {
  readonly request: PipelineRequest;
  readonly userId: string;
  readonly briefing: string;
  readonly lanes: readonly QualityLane[];
  readonly now: () => Date;
  readonly voiceHints?: Partial<VoiceProfile>;
  readonly generationContext?: GenerationContext;
  readonly lexicalQualityV2?: boolean;
  readonly onLaneProgress?: (progress: LaneProgress) => Effect.Effect<void>;
}

export interface VoiceProfileResolutionInput {
  readonly request: PipelineRequest;
  readonly userId: string;
  readonly briefing: string;
  readonly voiceHints?: Partial<VoiceProfile>;
}

export interface CriticFinding {
  readonly type: "generic" | "performative" | "cliche" | "redundant" | "llmish";
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
}

export interface CandidateScoreBreakdown {
  readonly criticScore: number;
  readonly fidelityScore: number;
  readonly driftScore: number;
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
