import { Mono, Ring } from "../primitives/index.js";

export interface VoiceEmptyStateProps {
  readonly onCalibrate: () => void;
  readonly size?: number;
  readonly description: string;
  readonly ctaLabel: string;
}

// Reused as-is by both the route (larger ring) and the shell companion (56px) — one component,
// two call sites, per the "uma fonte, duas superfícies" rule.
export function VoiceEmptyState({ onCalibrate, size = 56, description, ctaLabel }: VoiceEmptyStateProps) {
  return (
    <div className="voice-empty-state">
      <Ring value={0} size={size} width={3} />
      <p className="voice-empty-state-copy">{description}</p>
      <button type="button" className="voice-empty-state-cta" onClick={onCalibrate}>
        <Mono as="span">{ctaLabel}</Mono>
      </button>
    </div>
  );
}
