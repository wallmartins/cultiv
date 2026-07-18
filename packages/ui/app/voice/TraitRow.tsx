import { Mono, Pill, Ring } from "../primitives/index.js";
import type { TraitBadgeTone, TraitVM } from "./types.js";

export interface TraitRowProps {
  readonly trait: TraitVM;
  readonly onConfirm: () => void;
  readonly onContest: () => void;
  readonly pending: boolean;
}

const BADGE_CLASS: Record<TraitBadgeTone, string> = {
  accent: "is-accent",
  danger: "is-danger",
  neutral: "is-neutral"
};

export function TraitRow({ trait, onConfirm, onContest, pending }: TraitRowProps) {
  const confirmActive = trait.badgeTone === "accent";
  const contestActive = trait.badgeTone === "danger";

  return (
    <div className="voice-trait-row">
      <Ring value={trait.confidenceValue} size={28} width={2.5} className="voice-trait-ring" />
      <div className="voice-trait-body">
        <div className="voice-trait-label">{trait.label}</div>
        <div className="voice-trait-desc">{trait.desc}</div>
      </div>
      <Mono as="span" className={`voice-trait-badge ${BADGE_CLASS[trait.badgeTone]}`}>
        {trait.badgeLabel}
      </Mono>
      <div className="voice-trait-actions">
        <Pill
          variant="outline"
          className={confirmActive ? "voice-trait-pill-confirm is-active" : "voice-trait-pill-confirm"}
          disabled={pending}
          onClick={onConfirm}
        >
          Confere
        </Pill>
        <Pill
          variant="outline"
          className={contestActive ? "voice-trait-pill-contest is-active" : "voice-trait-pill-contest"}
          disabled={pending}
          onClick={onContest}
        >
          Nem tanto
        </Pill>
      </div>
    </div>
  );
}
