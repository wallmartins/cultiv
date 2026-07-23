import { VoiceEmptyState } from "../voice/index.js";
import { useMessages } from "../i18n/index.js";

export interface LockedCompanionEmptyProps {
  readonly onCalibrate: () => void;
}

// Mesma "uma fonte, duas superfícies" que voice/VoiceEmptyState já serve ao companion normal
// (packages/ui/app/shell/VoiceCompanion.tsx) — o texto do travado é idêntico por design.
export function LockedCompanionEmpty({ onCalibrate }: LockedCompanionEmptyProps) {
  const t = useMessages();
  return (
    <VoiceEmptyState
      onCalibrate={onCalibrate}
      size={56}
      description={t.states.locked.companionEmpty.description}
      ctaLabel={t.states.locked.companionEmpty.ctaLabel}
    />
  );
}
