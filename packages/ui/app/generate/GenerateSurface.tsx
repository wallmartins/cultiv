import "./generate.css";
import {
  PastedThemeFormatted,
  QueueAndTrialGate,
  type PastedThemeFormattedProps,
  type QueueAndTrialGateProps
} from "../states/index.js";
import { useMessages } from "../i18n/index.js";
import { AnalyzingIndicator } from "./AnalyzingIndicator.js";
import { AudiencePicker, type AudiencePickerProps } from "./AudiencePicker.js";
import { ChannelPicker, type ChannelPickerProps } from "./ChannelPicker.js";
import { CostPreviewBand, type CostPreviewBandProps } from "./CostPreviewBand.js";
import { GuidedThread } from "./GuidedThread.js";
import { QuestionComposer, type QuestionComposerProps } from "./QuestionComposer.js";
import { SessionDoneCard, type SessionDoneCardProps } from "./SessionDoneCard.js";
import { ThemeHero, type ThemeHeroProps } from "./ThemeHero.js";
import type { GeneratePhase, ThreadMessageData } from "./types.js";

// The sticky composer area shows exactly one of these at a time — mutually exclusive per design
// (showComposer | showChannels | sessionDone | queue-gate).
export type ComposerRegion =
  | { readonly kind: "audience"; readonly props: AudiencePickerProps }
  | { readonly kind: "question"; readonly props: QuestionComposerProps }
  | { readonly kind: "channel"; readonly props: ChannelPickerProps }
  | { readonly kind: "done"; readonly props: SessionDoneCardProps }
  | { readonly kind: "queue-gate"; readonly props: QueueAndTrialGateProps };

export interface GenerateSurfaceProps {
  readonly phase: GeneratePhase;
  readonly hero: ThemeHeroProps;
  // 2g — set only while the pasted-markdown confirm card is up; replaces the hero, never the
  // thread (breakdown-15 §3.3-B, sub-fluxo do composer).
  readonly pastedPreview?: PastedThemeFormattedProps;
  readonly messages: readonly ThreadMessageData[];
  readonly composerRegion?: ComposerRegion;
  readonly costBand?: CostPreviewBandProps;
  // Shown across the generation phases when the voice rebuild failed — a light nudge to /voice (where
  // the retry lives) so the author knows they're composing over an unfinished profile, not silence.
  readonly voiceNotice?: { readonly text: string; readonly onReview: () => void };
}

// Orchestrates by phase — no state of its own, just picks which block renders (breakdown 08 §1a).
export function GenerateSurface({ phase, hero, pastedPreview, messages, composerRegion, costBand, voiceNotice }: GenerateSurfaceProps) {
  const t = useMessages();
  if (phase === "hero") {
    if (pastedPreview) {
      return (
        <div className="generate-hero">
          <div className="generate-hero-inner">
            <PastedThemeFormatted {...pastedPreview} />
          </div>
        </div>
      );
    }
    return <ThemeHero {...hero} />;
  }

  return (
    <div className="generate-surface">
      {voiceNotice ? (
        <button type="button" className="generate-voice-notice" onClick={voiceNotice.onReview}>
          {voiceNotice.text}
        </button>
      ) : null}
      <div className="generate-thread-region">
        <GuidedThread
          messages={messages}
          trailing={
            phase === "analyzing" ? (
              <AnalyzingIndicator />
            ) : phase === "firing" ? (
              <AnalyzingIndicator label={t.generate.startingGeneration} />
            ) : undefined
          }
        />
      </div>
      {phase === "thread" || phase === "narrowing" ? (
        <div className="generate-composer-sticky">
          <div className="generate-composer-inner">
            {composerRegion?.kind === "audience" ? <AudiencePicker {...composerRegion.props} /> : null}
            {composerRegion?.kind === "question" ? <QuestionComposer {...composerRegion.props} /> : null}
            {composerRegion?.kind === "channel" ? <ChannelPicker {...composerRegion.props} /> : null}
            {composerRegion?.kind === "done" ? <SessionDoneCard {...composerRegion.props} /> : null}
            {composerRegion?.kind === "queue-gate" ? <QueueAndTrialGate {...composerRegion.props} /> : null}
            {costBand ? <CostPreviewBand {...costBand} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
