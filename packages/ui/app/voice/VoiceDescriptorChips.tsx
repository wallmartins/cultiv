export interface VoiceDescriptorChipsProps {
  readonly chips: readonly string[];
}

// Read-only tags — not <Chip> (an interactive filter primitive); these carry no click behavior.
export function VoiceDescriptorChips({ chips }: VoiceDescriptorChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="voice-descriptor-chips">
      {chips.map((chip) => (
        <span key={chip} className="voice-descriptor-chip">
          {chip}
        </span>
      ))}
    </div>
  );
}
