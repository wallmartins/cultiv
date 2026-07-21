import { Mono, Ring } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface BuildingVoiceProps {
  readonly label?: string;
}

// Colapsa dentro do passo 6 — nunca vira estado do shell (breakdown-11 §3.3).
export function BuildingVoice({ label }: BuildingVoiceProps) {
  const t = useMessages();
  const resolvedLabel = label ?? t.onboarding.buildingVoiceLabel;
  return (
    <div className="wizard-building-voice" role="status" aria-label={resolvedLabel}>
      <Ring value={1} size={72} width={3} tone="accent" pulse />
      <Mono as="p" className="wizard-building-voice-label">
        {resolvedLabel}
      </Mono>
    </div>
  );
}
