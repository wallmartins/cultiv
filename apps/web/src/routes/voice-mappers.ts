import type {
  TraitKey,
  TraitStatus,
  VoiceCoverageItemView,
  VoiceProfileDiagnosticsView,
  VoiceProfileScreenView,
  VoiceTrainingConsentStatusView
} from "@my-ai-orchestrator/contracts";
import { TRAIT_KEYS } from "@my-ai-orchestrator/contracts";
import { confidenceRingValue } from "@my-ai-orchestrator/shared";
import type { AppFormatters, AppMessages } from "@my-ai-orchestrator/ui/app/i18n";
import { voiceSignalLabel } from "@my-ai-orchestrator/ui/app/i18n";
import type { RingTone } from "@my-ai-orchestrator/ui/app/primitives";
import type { CoverageItemVM, TraitBadgeTone, TraitVM } from "@my-ai-orchestrator/ui/app/voice";

const BADGE_TONE_BY_STATUS: Record<TraitStatus, TraitBadgeTone> = {
  confirmed: "accent",
  disputed: "danger",
  inferred: "neutral",
  unknown: "neutral"
};

function badgeLabel(t: AppMessages, status: TraitStatus): string {
  if (status === "confirmed") return t.voice.traits.badge.confirmed;
  if (status === "disputed") return t.voice.traits.badge.disputed;
  return t.voice.traits.badge.inferred;
}

// traitProfile (from reasoning, gated by a feature flag) already overlays traitConfirmations
// server-side into `status` — prefer it. Falls back to the raw confirmation response when
// reasoning isn't included, so the row still shows a real state instead of always "Inferido".
function resolveTraitStatus(
  traitKey: TraitKey,
  reasoning: VoiceProfileScreenView["reasoning"],
  confirmations: VoiceProfileDiagnosticsView["traitConfirmations"]
): TraitStatus {
  const fromReasoning = reasoning?.development?.traitProfile?.records[traitKey]?.status;
  if (fromReasoning) return fromReasoning;

  const response = confirmations?.[traitKey]?.response;
  if (response === "confirmed") return "confirmed";
  if (response === "rejected") return "disputed";
  return "inferred";
}

export function buildTraits(profile: VoiceProfileScreenView, t: AppMessages): readonly TraitVM[] {
  const overallConfidence = confidenceRingValue(profile.profile.confidence);

  return TRAIT_KEYS.map((traitKey) => {
    const record = profile.reasoning?.development?.traitProfile?.records[traitKey];
    const status = resolveTraitStatus(traitKey, profile.reasoning, profile.diagnostics.traitConfirmations);
    const copy = t.voice.traits.copy[traitKey];

    return {
      traitKey,
      label: copy.label,
      desc: copy.desc,
      confidenceValue: record ? confidenceRingValue(record.confidence) : overallConfidence,
      badgeLabel: badgeLabel(t, status),
      badgeTone: BADGE_TONE_BY_STATUS[status]
    };
  });
}

export function buildProse(profile: VoiceProfileScreenView): { readonly core: string; readonly development: string } {
  return {
    core: profile.reasoning?.core.narrativeProse ?? "",
    development: profile.reasoning?.development?.developmentProse ?? ""
  };
}

export function buildDescriptorChips(profile: VoiceProfileScreenView, t: AppMessages): readonly string[] {
  return profile.profile.styleMarkers.map((value) => voiceSignalLabel(t, value));
}

export function buildRing(profile: VoiceProfileScreenView, t: AppMessages): { readonly value: number; readonly caption: string; readonly tone: RingTone } {
  const confidence = profile.profile.confidence;
  return {
    value: confidenceRingValue(confidence),
    caption: t.common.confidence.caption[confidence],
    tone: confidence === "low" ? "warning" : "accent"
  };
}

// GAP #13 — materialBase.samples are already display-ready {q, meta} strings from the backend
// (truncated quote + humanized pt-BR label + short date, computed live from the author's own
// stored examples) — no further mapping needed, just a graceful fallback when there's nothing yet.
export function buildMaterialBaseSamples(
  profile: VoiceProfileScreenView
): readonly { readonly q: string; readonly meta: string }[] {
  return profile.materialBase.samples ?? [];
}

// No calibration timestamp exists on VoiceProfileView — versionLabel sticks to real fields
// (version + example count) instead of fabricating a "calibrada em" date the contract doesn't give.
export function buildVersionLabel(profile: VoiceProfileScreenView, t: AppMessages): string {
  const count = profile.materialBase.totalExamples;
  return t.voice.versionLabel(profile.profile.version, t.common.samples(count));
}

// GAP J2-adjacent — VoiceCoverageItemView.contentType is a raw catalog id, not a label. Known
// ids get real translated names; anything new falls back to a humanized id instead of leaking the
// raw enum into the DOM.
function contentTypeLabel(id: string, t: AppMessages): string {
  const known = (t.voice.contentType as Record<string, string | undefined>)[id];
  return known ?? id.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function toCoverageItem(item: VoiceCoverageItemView, t: AppMessages): CoverageItemVM {
  return {
    label: contentTypeLabel(item.contentType, t),
    caption: t.common.confidence.caption[item.coverage],
    value: confidenceRingValue(item.coverage)
  };
}

export function buildCoverage(
  diagnostics: VoiceProfileDiagnosticsView,
  t: AppMessages
): {
  readonly items: readonly CoverageItemVM[];
  readonly nextStep: string;
} {
  const items = [...diagnostics.bestCoveredContentTypes, ...diagnostics.underrepresentedContentTypes].map((item) =>
    toCoverageItem(item, t)
  );

  const weakest = diagnostics.underrepresentedContentTypes[0];
  const nextStep = weakest
    ? t.voice.coverage.nextStepWeak(contentTypeLabel(weakest.contentType, t))
    : t.voice.coverage.nextStepBalanced;

  return { items, nextStep };
}

export function buildConsentSinceLabel(
  consent: VoiceTrainingConsentStatusView,
  t: AppMessages,
  format: AppFormatters
): string {
  const since = consent.granted ? consent.grantedAt : consent.revokedAt;
  return since ? t.voice.consent.since(format.date(since)) : "";
}
