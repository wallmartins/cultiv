import { Mono, Ring } from "../primitives/index.js";

export interface BuildingVoiceProps {
  readonly label?: string;
}

// Colapsa dentro do passo 6 — nunca vira estado do shell (breakdown-11 §3.3).
export function BuildingVoice({ label = "construindo sua voz…" }: BuildingVoiceProps) {
  return (
    <div className="wizard-building-voice" role="status" aria-label={label}>
      <Ring value={1} size={72} width={3} tone="accent" pulse />
      <Mono as="p" className="wizard-building-voice-label">
        {label}
      </Mono>
    </div>
  );
}
