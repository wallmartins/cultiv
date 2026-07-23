import { Mono, Panel as ProfileCard, Serif } from "../primitives/index.js";
// Loaded here too (not just VoiceProfileScreen.tsx) — the companion can mount during /generate
// before the user ever visits /voice, and needs the same classes styled either way.
import "../voice/voice.css";
import { ConfidenceRing } from "../voice/ConfidenceRing.js";
import { VoiceDescriptorChips } from "../voice/VoiceDescriptorChips.js";
import { VoiceEmptyState } from "../voice/VoiceEmptyState.js";
import { VoiceProseCard } from "../voice/VoiceProseCard.js";
import { LockedCompanionEmpty } from "../locked/index.js";
import type { VoiceCompanionContent } from "./types.js";
import { useMessages } from "../i18n/index.js";

export interface VoiceCompanionProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly content: VoiceCompanionContent;
}

export function VoiceCompanion({ open, onClose, content }: VoiceCompanionProps) {
  const t = useMessages();
  if (!open) return null;

  return (
    <div className="voice-companion">
      <div className="voice-companion-header">
        <Mono as="span" className="voice-companion-title">
          {t.shell.companion.title}
        </Mono>
        <button type="button" className="icon-button" onClick={onClose} aria-label={t.shell.companion.close}>
          ×
        </button>
      </div>
      {content.kind === "empty" ? (
        <CompanionEmpty onCalibrate={content.onCalibrate} />
      ) : content.kind === "locked" ? (
        <LockedCompanionEmpty onCalibrate={content.onCalibrate} />
      ) : (
        <CompanionReady {...content} />
      )}
    </div>
  );
}

// Same component the route's empty branch uses (VoiceProfileScreen.tsx) — "uma fonte, duas
// superfícies" applies to empty state too, not just ready.
function CompanionEmpty({ onCalibrate }: { onCalibrate: () => void }) {
  const t = useMessages();
  return (
    <VoiceEmptyState
      onCalibrate={onCalibrate}
      size={56}
      description={t.shell.companion.emptyDescription}
      ctaLabel={t.shell.companion.emptyCta}
    />
  );
}

// Strict read-only subset of the route's presentationals (breakdown-10 §1b): ring + one prose
// card + a few descriptor chips + a link out. No TraitReviewList/ConsentPanel/material-base here.
function CompanionReady({
  confidenceValue,
  confidenceCaption,
  headline,
  meta,
  proseCore,
  descriptorChips,
  practice,
  rebuildFailure,
  onSeeProfile
}: Extract<VoiceCompanionContent, { kind: "ready" }>) {
  const t = useMessages();
  return (
    <div className="companion-ready">
      <ProfileCard dialog className="companion-ready-summary">
        <ConfidenceRing value={confidenceValue} caption={confidenceCaption} size={56} />
        <div>
          <Serif as="div" className="companion-ready-headline">
            {headline}
          </Serif>
          <Mono as="div" className="companion-ready-meta">
            {meta}
          </Mono>
        </div>
      </ProfileCard>
      {rebuildFailure ? (
        <div className="companion-ready-nudge">
          <div className="companion-ready-nudge-text">{rebuildFailure.text}</div>
          <button
            type="button"
            className="companion-ready-link"
            onClick={rebuildFailure.onRetry}
            disabled={rebuildFailure.pending}
          >
            <Mono as="span">{t.common.retry}</Mono>
          </button>
        </div>
      ) : null}
      <VoiceProseCard heading={t.shell.companion.howIThink} body={proseCore} />
      <VoiceDescriptorChips chips={descriptorChips.slice(0, 3)} />
      {practice ? (
        <div className="companion-ready-practice">
          <Mono as="div" className="companion-ready-practice-heading">
            {t.shell.companion.practiceHeading}
          </Mono>
          <div className="companion-ready-practice-line">
            {practice.subjectLabel}: {practice.subject} · {practice.depthLabel}
          </div>
        </div>
      ) : null}
      <button type="button" className="companion-ready-link" onClick={onSeeProfile}>
        <Mono as="span">{t.shell.companion.seeFullProfile}</Mono>
      </button>
    </div>
  );
}
