import { Mono, StatusDot } from "../primitives/index.js";

export interface AnalyzingIndicatorProps {
  readonly label?: string;
}

// Shared between the prefill wait (phase 'analyzing') and the fire-and-navigate wait (phase
// 'firing') — same light, non-blocking treatment, different one-line copy.
export function AnalyzingIndicator({ label = "analisando o seu tema…" }: AnalyzingIndicatorProps) {
  return (
    <div className="generate-analyzing">
      <StatusDot tone="live" />
      <Mono style={{ color: "var(--muted)" }}>{label}</Mono>
    </div>
  );
}
