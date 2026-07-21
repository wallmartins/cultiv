import { Mono, StatusDot } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface AnalyzingIndicatorProps {
  readonly label?: string;
}

// Shared between the prefill wait (phase 'analyzing') and the fire-and-navigate wait (phase
// 'firing') — same light, non-blocking treatment, different one-line copy.
export function AnalyzingIndicator({ label }: AnalyzingIndicatorProps) {
  const t = useMessages();
  return (
    <div className="generate-analyzing">
      <StatusDot tone="live" />
      <Mono style={{ color: "var(--muted)" }}>{label ?? t.generate.analyzingTheme}</Mono>
    </div>
  );
}
