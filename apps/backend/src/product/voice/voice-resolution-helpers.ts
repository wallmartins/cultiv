import type {
  ExecutionVoiceMetadataView,
  FallbackReasonCode,
  VoiceAdaptationMode,
  VoiceProfileConfidence
} from "@my-ai-orchestrator/contracts";
import type { NextActionCode } from "@my-ai-orchestrator/contracts";
import type { VoiceProfile } from "@my-ai-orchestrator/text-quality";
import { normalizeLanguage } from "./voice-utils.js";

export function buildEffectiveVoiceMetadata(args: {
  readonly profile: {
    readonly profileVersion: number;
    readonly snapshotId: string;
    readonly confidence: VoiceProfileConfidence;
    readonly adaptationMode: "conservative" | "standard";
    readonly primaryLanguage: string;
  };
  readonly diagnostics: {
    readonly activeVersion: number;
    readonly pendingVersion?: number;
    readonly pendingRebuild: {
      readonly status: "idle" | "in_progress" | "failed";
      readonly reasonCode?: string;
      readonly nextActionCodes: readonly NextActionCode[];
    };
  };
  readonly context: {
    readonly contentType: string;
    readonly requestedLanguage?: string;
  };
  readonly confidence: VoiceProfileConfidence;
  readonly adaptationMode: VoiceAdaptationMode;
  readonly fallbackReasonCode?: FallbackReasonCode;
  readonly usedFallbackVoiceProfile: boolean;
  readonly voiceHints: Partial<VoiceProfile>;
  readonly snapshotId: string;
}): ExecutionVoiceMetadataView {
  return {
    voiceProfileConfidence: args.confidence,
    voiceAdaptationMode: args.adaptationMode,
    voiceProfileVersionUsed: args.profile.profileVersion,
    pendingVoiceProfileVersion: args.diagnostics.pendingVersion,
    voiceProfileSnapshotId: args.snapshotId,
    usedFallbackVoiceProfile: args.usedFallbackVoiceProfile,
    fallbackReasonCode: args.fallbackReasonCode,
    appliedSignals: {
      styleMarkers: args.voiceHints.styleMarkers ?? [],
      rules: args.voiceHints.rules ?? [],
      antiPatterns: args.voiceHints.antiPatterns ?? [],
      ...(args.voiceHints.coreReasoningSignature
        ? {
            reasoningApplied: true,
            certaintyLevel: args.voiceHints.coreReasoningSignature.certaintyLevel,
            conclusionPace: args.voiceHints.coreReasoningSignature.conclusionPace
          }
        : {})
    },
    pendingProfileRebuild: {
      status: args.diagnostics.pendingRebuild.status,
      reasonCode: args.diagnostics.pendingRebuild.reasonCode as FallbackReasonCode | undefined,
      nextActionCodes: [...args.diagnostics.pendingRebuild.nextActionCodes]
    }
  };
}

export function resolveAdaptationMode(
  confidence: VoiceProfileConfidence,
  usedFallbackVoiceProfile: boolean,
  requestedLanguage?: string,
  primaryLanguage?: string
): VoiceAdaptationMode {
  if (confidence === "low" || usedFallbackVoiceProfile) {
    return "conservative";
  }

  if (
    typeof requestedLanguage === "string"
    && typeof primaryLanguage === "string"
    && normalizeLanguage(requestedLanguage) !== normalizeLanguage(primaryLanguage)
  ) {
    return "conservative";
  }

  return "standard";
}

export function resolveFallbackReasonCode(
  status: "idle" | "in_progress" | "failed"
): FallbackReasonCode | undefined {
  switch (status) {
    case "in_progress":
      return "rebuild_in_progress";
    case "failed":
      return "rebuild_failed";
    default:
      return undefined;
  }
}

export function buildVoiceProfileSnapshotId(
  userId: string,
  profileVersion: number,
  contentType: string,
  timestamp: Date
): string {
  return `voice-profile-snapshot:${userId}:v${profileVersion}:${contentType}:${timestamp.toISOString()}`;
}
