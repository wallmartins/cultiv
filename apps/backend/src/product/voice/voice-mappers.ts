import type {
  DevelopmentTraitProfile,
  TraitKey,
  TraitRecord,
  VoiceProfileDiagnosticsView,
  VoiceProfileScreenView,
  VoiceProfileView,
  VoiceReasoningPresentationView
} from "@my-ai-orchestrator/contracts";
import { TRAIT_KEYS } from "@my-ai-orchestrator/contracts";
import type {
  DerivedVoiceProfile,
  VoiceProfileDiagnostics
} from "@my-ai-orchestrator/domain";
import { mergeTraitConfirmations } from "./trait-confirmation-overlay.js";

export function toVoiceProfileView(profile: DerivedVoiceProfile): VoiceProfileView {
  return {
    userId: profile.userId,
    snapshotId: profile.snapshotId,
    version: profile.version,
    confidence: profile.confidence,
    adaptationMode: profile.adaptationMode,
    primaryLanguage: profile.primaryLanguage,
    tone: profile.tone,
    cadence: profile.cadence,
    description: profile.description,
    lexicon: [...profile.lexicon],
    constraints: [...profile.constraints],
    styleMarkers: [...profile.styleMarkers],
    rules: [...profile.rules],
    antiPatterns: [...profile.antiPatterns]
  };
}

export function toVoiceProfileDiagnosticsView(
  diagnostics: VoiceProfileDiagnostics
): VoiceProfileDiagnosticsView {
  return {
    updating: diagnostics.updating,
    activeVersion: diagnostics.activeVersion,
    pendingVersion: diagnostics.pendingVersion,
    summary: diagnostics.summary,
    reasonCodes: [...diagnostics.reasonCodes],
    nextActionCodes: [...diagnostics.nextActionCodes],
    bestCoveredContentTypes: diagnostics.bestCoveredContentTypes.map((item) => ({
      contentType: item.contentType,
      coverage: item.coverage,
      reasonCodes: [...item.reasonCodes]
    })),
    underrepresentedContentTypes: diagnostics.underrepresentedContentTypes.map((item) => ({
      contentType: item.contentType,
      coverage: item.coverage,
      reasonCodes: [...item.reasonCodes]
    })),
    pendingRebuild: {
      status: diagnostics.pendingRebuild.status,
      reasonCode: diagnostics.pendingRebuild.reasonCode,
      nextActionCodes: [...diagnostics.pendingRebuild.nextActionCodes]
    },
    ...(diagnostics.traitConfirmations
      ? {
          traitConfirmations: Object.fromEntries(
            Object.entries(diagnostics.traitConfirmations).map(([key, value]) => [key, { ...value }])
          )
        }
      : {})
  };
}

export function toVoiceProfileScreenView(
  profile: DerivedVoiceProfile,
  diagnostics: VoiceProfileDiagnostics,
  options?: { readonly includeReasoning?: boolean }
): VoiceProfileScreenView {
  return {
    profile: toVoiceProfileView(profile),
    diagnostics: toVoiceProfileDiagnosticsView(diagnostics),
    materialBase: {
      ...diagnostics.materialBase,
      byClassification: { ...diagnostics.materialBase.byClassification },
      byContentType: { ...diagnostics.materialBase.byContentType },
      byLanguage: { ...diagnostics.materialBase.byLanguage }
    },
    ...(options?.includeReasoning && profile.coreReasoningSignature
      ? {
          reasoning: toVoiceReasoningPresentationView(profile, {
            activeExamples: diagnostics.materialBase.activeExamples,
            traitConfirmations: diagnostics.traitConfirmations
          })
        }
      : {}),
    ...(profile.quantitativeSignals ? { quantitativeSignals: profile.quantitativeSignals } : {})
  };
}

export function toVoiceReasoningPresentationView(
  profile: DerivedVoiceProfile,
  options?: {
    readonly activeExamples?: number;
    readonly traitConfirmations?: VoiceProfileDiagnostics["traitConfirmations"];
  }
): VoiceReasoningPresentationView | undefined {
  if (!profile.coreReasoningSignature) {
    return undefined;
  }

  const rawTraitProfile = profile.argumentDevelopmentSignature?.traitProfile;
  const traitProfile = rawTraitProfile
    ? overlayTraitConfirmations(rawTraitProfile, options?.traitConfirmations)
    : undefined;

  return {
    core: { ...profile.coreReasoningSignature, derivedAntiPatterns: [...profile.coreReasoningSignature.derivedAntiPatterns] },
    reasoningVersion: profile.version,
    ...(profile.argumentDevelopmentSignature
      ? {
          development: {
            ...profile.argumentDevelopmentSignature,
            moveLabels: [...profile.argumentDevelopmentSignature.moveLabels],
            structuralAntiPatterns: [...profile.argumentDevelopmentSignature.structuralAntiPatterns],
            transitionTendencies: profile.argumentDevelopmentSignature.transitionTendencies.map((tendency) => ({
              ...tendency
            })),
            ...(traitProfile ? { traitProfile } : {})
          },
          developmentImmature:
            typeof options?.activeExamples === "number"
            && options.activeExamples >= 2
            && options.activeExamples < 3,
          ...(traitProfile ? { traitProfile } : {})
        }
      : {})
  };
}

function cloneDevelopmentTraitProfile(traitProfile: DevelopmentTraitProfile): DevelopmentTraitProfile {
  const records = TRAIT_KEYS.reduce<Record<TraitKey, TraitRecord>>((acc, key) => {
    const record = traitProfile.records[key];
    acc[key] = {
      ...record,
      evidenceExampleIds: [...record.evidenceExampleIds]
    };
    return acc;
  }, {} as Record<TraitKey, TraitRecord>);

  return {
    traits: { ...traitProfile.traits },
    records
  };
}

function overlayTraitConfirmations(
  traitProfile: DevelopmentTraitProfile,
  confirmations?: VoiceProfileDiagnostics["traitConfirmations"]
): DevelopmentTraitProfile {
  if (!confirmations) {
    return cloneDevelopmentTraitProfile(traitProfile);
  }

  const confirmationResponses = Object.fromEntries(
    Object.entries(confirmations).map(([key, record]) => [key, { response: record.response }])
  ) as Partial<Record<TraitKey, { readonly response: "confirmed" | "rejected" | "skipped" }>>;

  return mergeTraitConfirmations(traitProfile, confirmationResponses);
}


