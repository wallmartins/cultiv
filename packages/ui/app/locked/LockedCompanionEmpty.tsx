import { VoiceEmptyState } from "../voice/index.js";

export interface LockedCompanionEmptyProps {
  readonly onCalibrate: () => void;
}

// Mesma "uma fonte, duas superfícies" que voice/VoiceEmptyState já serve ao companion normal
// (packages/ui/app/shell/VoiceCompanion.tsx) — o texto do travado é idêntico por design.
export function LockedCompanionEmpty({ onCalibrate }: LockedCompanionEmptyProps) {
  return (
    <VoiceEmptyState
      onCalibrate={onCalibrate}
      size={56}
      description="sua voz aparece aqui depois da calibração"
      ctaLabel="calibrar minha voz →"
    />
  );
}
