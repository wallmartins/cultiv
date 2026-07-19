import type {
  TraitKey,
  TraitStatus,
  VoiceCoverageItemView,
  VoiceProfileDiagnosticsView,
  VoiceProfileScreenView,
  VoiceTrainingConsentStatusView
} from "@my-ai-orchestrator/contracts";
import { TRAIT_KEYS } from "@my-ai-orchestrator/contracts";
import { confidenceCaption, confidenceRingValue } from "@my-ai-orchestrator/shared";
import type { RingTone } from "@my-ai-orchestrator/ui/app/primitives";
import type { CoverageItemVM, TraitBadgeTone, TraitVM } from "@my-ai-orchestrator/ui/app/voice";

// GAP J3 (breakdown-10 §5) — traitConfirmations/traitProfile carry no pt-BR copy, only the enum
// key. Client-side map for the 7 fixed keys (TRAIT_KEYS never changes shape); graduates to the
// view once the backend curates trait copy per-user.
const TRAIT_COPY: Record<TraitKey, { readonly label: string; readonly desc: string }> = {
  openingMode: { label: "Abertura por observação", desc: "prefere partir de uma cena ou tensão concreta antes da tese" },
  perspectiveShiftDensity: {
    label: "Densidade de reviravoltas",
    desc: "quantas vezes o argumento muda de ângulo ao longo do texto"
  },
  usesCounterexamples: { label: "Uso de contraexemplos", desc: "testa a própria tese com casos que a contradizem" },
  selfQuestioning: { label: "Autoquestionamento", desc: "assume a dúvida em vez de fingir certeza" },
  insightTiming: { label: "Timing do insight", desc: "quando a ideia central aparece — na abertura ou só no fecho" },
  usesAnalogies: { label: "Uso de analogias", desc: "recorre a metáforas e comparações pra explicar um ponto" },
  closingMode: { label: "Fecho do texto", desc: "amarra numa conclusão ou devolve a pergunta ao leitor" }
};

const BADGE_BY_STATUS: Record<TraitStatus, { readonly label: string; readonly tone: TraitBadgeTone }> = {
  confirmed: { label: "Confirmado", tone: "accent" },
  disputed: { label: "Contestado", tone: "danger" },
  inferred: { label: "Inferido", tone: "neutral" },
  unknown: { label: "Inferido", tone: "neutral" }
};

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

export function buildTraits(profile: VoiceProfileScreenView): readonly TraitVM[] {
  const overallConfidence = confidenceRingValue(profile.profile.confidence);

  return TRAIT_KEYS.map((traitKey) => {
    const record = profile.reasoning?.development?.traitProfile?.records[traitKey];
    const status = resolveTraitStatus(traitKey, profile.reasoning, profile.diagnostics.traitConfirmations);
    const badge = BADGE_BY_STATUS[status];

    return {
      traitKey,
      label: TRAIT_COPY[traitKey].label,
      desc: TRAIT_COPY[traitKey].desc,
      confidenceValue: record ? confidenceRingValue(record.confidence) : overallConfidence,
      badgeLabel: badge.label,
      badgeTone: badge.tone
    };
  });
}

export function buildProse(profile: VoiceProfileScreenView): { readonly core: string; readonly development: string } {
  return {
    core: profile.reasoning?.core.narrativeProse ?? "",
    development: profile.reasoning?.development?.developmentProse ?? ""
  };
}

// profile.styleMarkers are already humanized pt-BR phrases from the backend (same field the
// execution-detail alignment strip reads, apps/web/src/routes/detail-view.ts) — no enum to map.
export function buildDescriptorChips(profile: VoiceProfileScreenView): readonly string[] {
  return profile.profile.styleMarkers;
}

export function buildRing(profile: VoiceProfileScreenView): { readonly value: number; readonly caption: string; readonly tone: RingTone } {
  const confidence = profile.profile.confidence;
  return {
    value: confidenceRingValue(confidence),
    caption: confidenceCaption(confidence),
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
export function buildVersionLabel(profile: VoiceProfileScreenView): string {
  const count = profile.materialBase.totalExamples;
  return `versão ${profile.profile.version} · ${count} ${count === 1 ? "amostra" : "amostras"}`;
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  "linkedin-post": "LinkedIn",
  newsletter: "Newsletter",
  "validation-post": "Post de validação",
  "architecture-post": "Post técnico",
  "long-form-blog": "Blog longo",
  "twitter-thread": "Thread"
};

// GAP J2-adjacent — VoiceCoverageItemView.contentType is a raw catalog id, not a label. Known
// ids get real pt-BR names; anything new falls back to a humanized id instead of leaking the raw
// enum into the DOM.
function contentTypeLabel(id: string): string {
  return CONTENT_TYPE_LABEL[id] ?? id.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function toCoverageItem(item: VoiceCoverageItemView): CoverageItemVM {
  return {
    label: contentTypeLabel(item.contentType),
    caption: confidenceCaption(item.coverage),
    value: confidenceRingValue(item.coverage)
  };
}

export function buildCoverage(diagnostics: VoiceProfileDiagnosticsView): {
  readonly items: readonly CoverageItemVM[];
  readonly nextStep: string;
} {
  const items = [...diagnostics.bestCoveredContentTypes, ...diagnostics.underrepresentedContentTypes].map(
    toCoverageItem
  );

  const weakest = diagnostics.underrepresentedContentTypes[0];
  const nextStep = weakest
    ? `sua voz ainda tem pouco fôlego em ${contentTypeLabel(weakest.contentType)} — recalibrar aumenta a confiança.`
    : "cobertura equilibrada entre os formatos calibrados.";

  return { items, nextStep };
}

function formatFullDate(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
}

export function buildConsentSinceLabel(consent: VoiceTrainingConsentStatusView): string {
  const since = consent.granted ? consent.grantedAt : consent.revokedAt;
  return since ? `desde ${formatFullDate(since)}` : "";
}
