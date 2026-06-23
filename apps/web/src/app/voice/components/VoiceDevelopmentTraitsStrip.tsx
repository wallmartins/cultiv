import { Text } from "@my-ai-orchestrator/ui";
import type { DevelopmentTraitProfile, TraitConfidence, TraitKey, TraitRecord } from "@my-ai-orchestrator/contracts";
import type { AppMessages } from "~/i18n/app/types";

interface VoiceDevelopmentTraitsStripProps {
  readonly messages: AppMessages["voice"]["reasoning"];
  readonly traitProfile: DevelopmentTraitProfile;
  readonly developmentImmature?: boolean;
  readonly onAuthorityLinkClick?: () => void;
}

const TRAIT_STRIP_ORDER: readonly TraitKey[] = [
  "openingMode",
  "perspectiveShiftDensity",
  "usesCounterexamples",
  "selfQuestioning",
  "insightTiming",
  "usesAnalogies",
  "closingMode"
];

export function VoiceDevelopmentTraitsStrip({
  messages,
  traitProfile,
  developmentImmature,
  onAuthorityLinkClick
}: VoiceDevelopmentTraitsStripProps) {
  const traitMessages = messages.developmentTraits;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TRAIT_STRIP_ORDER.map((traitKey) => (
          <TraitStripCell
            key={traitKey}
            label={traitMessages.labels[traitKey]}
            record={traitProfile.records[traitKey]}
            enumLabel={resolveTraitEnumLabel(messages, traitKey, traitProfile.records[traitKey])}
            unknownCopy={traitMessages.unknownGap}
            developmentImmature={developmentImmature}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Text variant="meta" className="text-ink-muted">
          {traitMessages.authorityLinkLabel}
        </Text>
        <button
          type="button"
          onClick={onAuthorityLinkClick}
          className="rounded-[var(--radius-press)] bg-pigment-terracotta/10 px-3 py-2 text-sm font-medium text-ink underline-offset-2 hover:underline"
        >
          {traitMessages.authorityLinkAction}
        </button>
      </div>
    </div>
  );
}

function TraitStripCell({
  label,
  record,
  enumLabel,
  unknownCopy,
  developmentImmature
}: {
  readonly label: string;
  readonly record?: TraitRecord;
  readonly enumLabel?: string;
  readonly unknownCopy: string;
  readonly developmentImmature?: boolean;
}) {
  const isUnknown = !record || record.status === "unknown" || enumLabel === undefined;
  const confidence = developmentImmature && record?.confidence === "high" ? "medium" : record?.confidence;

  return (
    <div className="rounded-[var(--radius-press)] border border-ink-ghost/60 bg-paper-elevated/40 px-3 py-3">
      <Text variant="meta" className="mb-1 block text-xs text-ink-muted">
        {label}
      </Text>
      <div className="flex items-center justify-between gap-3">
        {isUnknown ? (
          <Text variant="body" className="text-sm text-ink-muted">
            — {unknownCopy}
          </Text>
        ) : (
          <Text variant="body" className="text-sm font-medium text-ink">
            {enumLabel}
          </Text>
        )}
        {!isUnknown && confidence ? <TraitConfidenceDots confidence={confidence} /> : null}
      </div>
    </div>
  );
}

export function TraitConfidenceDots({ confidence }: { readonly confidence: TraitConfidence }) {
  const filled = confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;

  return (
    <span className="text-xs tracking-widest text-pigment-terracotta" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span key={index} className={index < filled ? "opacity-100" : "opacity-25"}>
          ●
        </span>
      ))}
    </span>
  );
}

function resolveTraitEnumLabel(
  messages: AppMessages["voice"]["reasoning"],
  traitKey: TraitKey,
  record?: TraitRecord
): string | undefined {
  if (!record?.value) {
    return undefined;
  }

  const enums = messages.developmentTraits.enums;
  const value = record.value;

  switch (traitKey) {
    case "openingMode":
      return enums.openingMode[value as keyof typeof enums.openingMode];
    case "perspectiveShiftDensity":
    case "selfQuestioning":
      return enums.density[value as keyof typeof enums.density];
    case "usesCounterexamples":
    case "usesAnalogies":
      return enums.frequency[value as keyof typeof enums.frequency];
    case "insightTiming":
      return enums.insightTiming[value as keyof typeof enums.insightTiming];
    case "closingMode":
      return enums.closingMode[value as keyof typeof enums.closingMode];
    default:
      return undefined;
  }
}
