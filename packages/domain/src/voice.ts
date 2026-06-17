import type {
  AttentionLevel,
  ContributionCode,
  ArgumentDevelopmentSignature,
  ClosingMode,
  CoreReasoningSignature,
  FormatExpressionProfile,
  InsightTiming,
  NextActionCode,
  OpeningMode,
  ReasonCode,
  TraitConfirmationRecord,
  TraitKey,
  VoiceAdaptationMode,
  VoiceCoverage,
  VoiceExampleState,
  VoiceProfileConfidence
} from "@my-ai-orchestrator/contracts";
import type { Entity, ValueObject } from "./core.js";

export interface VoiceExampleEvaluation extends ValueObject {
  readonly systemWeight: number;
  readonly attentionLevel: AttentionLevel;
  readonly attentionReasonCodes: readonly ReasonCode[];
  readonly contributionCode: ContributionCode;
  readonly contributionPreview: string;
  readonly userPinned: boolean;
}

export interface VoiceExamplePerformance extends ValueObject {
  readonly channel?: string;
  readonly publishedAt?: string;
  readonly selfRating?: number;
  readonly likes?: number;
  readonly comments?: number;
}

export interface VoiceExampleDraft extends ValueObject {
  readonly text: string;
  readonly language?: string;
  readonly channel?: string;
  readonly format?: string;
  readonly explicitContentType?: string;
  readonly context?: string;
  readonly antiPatternsExplicit?: readonly string[];
  readonly userLabels?: readonly string[];
  readonly pinned?: boolean;
  readonly performance?: VoiceExamplePerformance;
}

export interface VoiceExample extends Entity {
  readonly userId: string;
  readonly text: string;
  readonly language: string;
  readonly channel?: string;
  readonly format?: string;
  readonly explicitContentType?: string;
  readonly context?: string;
  readonly state: VoiceExampleState;
  readonly classificationLabels: readonly string[];
  readonly antiPatternsExplicit: readonly string[];
  readonly pinned: boolean;
  readonly pendingProfileImpact: boolean;
  readonly targetProfileVersion?: number;
  readonly effectiveContentTypeHints: readonly string[];
  readonly evaluation: VoiceExampleEvaluation;
  readonly performance?: VoiceExamplePerformance;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface VoiceCoverageItem extends ValueObject {
  readonly contentType: string;
  readonly coverage: VoiceCoverage;
  readonly reasonCodes: readonly ReasonCode[];
}

export interface PendingVoiceProfileRebuildState extends ValueObject {
  readonly status: "idle" | "in_progress" | "failed";
  readonly reasonCode?: ReasonCode;
  readonly nextActionCodes: readonly NextActionCode[];
}

export interface VoiceMaterialBaseBreakdown extends ValueObject {
  readonly totalExamples: number;
  readonly activeExamples: number;
  readonly excludedExamples: number;
  readonly pinnedExamples: number;
  readonly byClassification: Readonly<Record<string, number>>;
  readonly byContentType: Readonly<Record<string, number>>;
  readonly byLanguage: Readonly<Record<string, number>>;
}

export interface DerivedVoiceProfile extends Entity<string> {
  readonly userId: string;
  readonly version: number;
  readonly snapshotId: string;
  readonly confidence: VoiceProfileConfidence;
  readonly adaptationMode: VoiceAdaptationMode;
  readonly primaryLanguage: string;
  readonly tone: string;
  readonly cadence: string;
  readonly description?: string;
  readonly lexicon: readonly string[];
  readonly constraints: readonly string[];
  readonly styleMarkers: readonly string[];
  readonly rules: readonly string[];
  readonly antiPatterns: readonly string[];
  readonly coreReasoningSignature?: CoreReasoningSignature;
  readonly argumentDevelopmentSignature?: ArgumentDevelopmentSignature;
  readonly formatExpressionProfiles?: Readonly<Record<string, FormatExpressionProfile>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface VoiceProfileDiagnostics extends Entity<string> {
  readonly userId: string;
  readonly activeVersion: number;
  readonly pendingVersion?: number;
  readonly updating: boolean;
  readonly summary?: string;
  readonly reasonCodes: readonly ReasonCode[];
  readonly nextActionCodes: readonly NextActionCode[];
  readonly bestCoveredContentTypes: readonly VoiceCoverageItem[];
  readonly underrepresentedContentTypes: readonly VoiceCoverageItem[];
  readonly pendingRebuild: PendingVoiceProfileRebuildState;
  readonly materialBase: VoiceMaterialBaseBreakdown;
  readonly traitConfirmations?: Readonly<Partial<Record<TraitKey, TraitConfirmationRecord>>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface VoiceProfileSnapshot extends Entity<string> {
  readonly userId: string;
  readonly sourceProfileId: string;
  readonly sourceProfileVersion: number;
  readonly contentType: string;
  readonly confidence: VoiceProfileConfidence;
  readonly adaptationMode: VoiceAdaptationMode;
  readonly appliedSignals: {
    readonly styleMarkers: readonly string[];
    readonly rules: readonly string[];
    readonly antiPatterns: readonly string[];
    readonly reasoningApplied?: boolean;
    readonly developmentApplied?: boolean;
    readonly certaintyLevel?: CoreReasoningSignature["certaintyLevel"];
    readonly conclusionPace?: CoreReasoningSignature["conclusionPace"];
    readonly epistemicPosture?: ArgumentDevelopmentSignature["epistemicPosture"];
    readonly developmentTraitsApplied?: boolean;
    readonly openingMode?: OpeningMode;
    readonly closingMode?: ClosingMode;
    readonly insightTiming?: InsightTiming;
  };
  readonly resolutionContext: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
}

export interface VoiceExampleBatchItem extends Entity<string> {
  readonly batchId: string;
  readonly clientItemId: string;
  readonly accepted: boolean;
  readonly exampleId?: string;
  readonly stagedInput?: VoiceExampleDraft;
  readonly reasonCode?: ReasonCode;
  readonly message?: string;
  readonly createdAt: string;
}

export interface VoiceExampleBatch extends Entity<string> {
  readonly userId: string;
  readonly status: "open" | "committed" | "expired";
  readonly expiresAt: string;
  readonly committedAt?: string;
  readonly targetProfileVersion?: number;
  readonly acceptedItems: number;
  readonly rejectedItems: number;
  readonly items: readonly VoiceExampleBatchItem[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface VoiceTrainingConsent extends Entity<string> {
  readonly userId: string;
  readonly granted: boolean;
  readonly grantedAt?: string;
  readonly revokedAt?: string;
  readonly evidenceBoundary: "consent";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function createVoiceExample(example: VoiceExample): VoiceExample {
  return example;
}

export function createDerivedVoiceProfile(profile: DerivedVoiceProfile): DerivedVoiceProfile {
  return profile;
}

export function createVoiceProfileDiagnostics(diagnostics: VoiceProfileDiagnostics): VoiceProfileDiagnostics {
  return diagnostics;
}

export function createVoiceProfileSnapshot(snapshot: VoiceProfileSnapshot): VoiceProfileSnapshot {
  return snapshot;
}

export function createVoiceExampleBatch(batch: VoiceExampleBatch): VoiceExampleBatch {
  return batch;
}
