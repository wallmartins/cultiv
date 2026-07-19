import type {
  DevelopmentTraitProfile,
  TraitKey,
  TraitRecord,
  VoiceMaterialBaseSample,
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
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import { mergeTraitConfirmations } from "./trait-confirmation-overlay.js";

// GAP #13 — known channel/content-type ids get a curated pt-BR label; anything else falls back
// to a humanized version of the raw id, same convention as apps/web/src/routes/voice-mappers.ts
// contentTypeLabel (never leak a raw enum/id into the DOM).
const MATERIAL_BASE_SAMPLE_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  "linkedin-post": "LinkedIn",
  newsletter: "Newsletter",
  blog: "Blog",
  "long-form-blog": "Blog longo",
  "validation-post": "Post de validação",
  "architecture-post": "Post técnico",
  "twitter-thread": "Thread"
};

function humanizeMaterialBaseSampleLabel(id: string): string {
  return (
    MATERIAL_BASE_SAMPLE_LABELS[id]
    ?? id
      .split(/[-_]/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ")
  );
}

const MATERIAL_BASE_SAMPLE_MONTHS_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"
];

function formatMaterialBaseSampleDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getUTCDate()} ${MATERIAL_BASE_SAMPLE_MONTHS_PT[date.getUTCMonth()]}`;
}

function truncateMaterialBaseSampleQuote(text: string, maxLength = 150): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const cut = trimmed.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const wholeWordCut = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return `${wholeWordCut.trimEnd()}…`;
}

// Formats already-selected examples (selectMaterialBaseSampleExamples) into display-ready quotes
// — pure presentation, no re-inference of voice signals (voice-profile-centralization stays green).
export function toMaterialBaseSamples(
  examples: readonly VoiceExampleRecord[]
): readonly VoiceMaterialBaseSample[] {
  return examples.map((example) => ({
    q: truncateMaterialBaseSampleQuote(example.text),
    meta: `${humanizeMaterialBaseSampleLabel(
      example.channel ?? example.explicitContentType ?? example.format ?? "geral"
    )} · ${formatMaterialBaseSampleDate(example.createdAt)}`
  }));
}

export function toVoiceProfileView(profile: DerivedVoiceProfile): VoiceProfileView {
  return {
    userId: profile.userId,
    snapshotId: profile.snapshotId,
    version: profile.version,
    confidence: profile.confidence,
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
  options?: {
    readonly includeReasoning?: boolean;
    readonly samples?: readonly VoiceMaterialBaseSample[];
  }
): VoiceProfileScreenView {
  return {
    profile: toVoiceProfileView(profile),
    diagnostics: toVoiceProfileDiagnosticsView(diagnostics),
    materialBase: {
      ...diagnostics.materialBase,
      byClassification: { ...diagnostics.materialBase.byClassification },
      byContentType: { ...diagnostics.materialBase.byContentType },
      byLanguage: { ...diagnostics.materialBase.byLanguage },
      ...(options?.samples ? { samples: options.samples } : {})
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


