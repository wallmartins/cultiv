import { Mono, StatusDot } from "../primitives/index.js";

export interface TrialLineProps {
  readonly label: string;
}

// showTrial (design L164–166) — "5 gerações no teste · N restantes · N dias". Copy is built
// upstream (container) from real entitlement fields; this just lays out dot + mono.
export function TrialLine({ label }: TrialLineProps) {
  return (
    <div className="generate-trial-line">
      <StatusDot tone="accent" />
      <Mono style={{ color: "var(--muted)" }}>{label}</Mono>
    </div>
  );
}
