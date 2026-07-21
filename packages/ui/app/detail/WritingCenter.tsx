import { Mono, Ring, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface WritingCenterProps {
  readonly percent: number;
  readonly topic: string;
}

// dRunning (design L1247–1256) — lives at /app/g/$id while status is queued|running.
export function WritingCenter({ percent, topic }: WritingCenterProps) {
  const t = useMessages();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "60px 0", textAlign: "center" }}>
      <Ring value={percent / 100} size={96} width={4} tone="accent">
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "1.5rem" }}>{Math.round(percent)}%</span>
      </Ring>
      <Serif size="1.6rem">{t.detail.writing}</Serif>
      <Mono style={{ color: "var(--muted)" }}>{topic}</Mono>
    </div>
  );
}
