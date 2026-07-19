import { Chip, Mono, Pill, Ring, Serif } from "../primitives/index.js";

export interface VoiceDriftNudgeProps {
  readonly confidenceFrom: number;
  readonly confidenceTo: number;
  readonly onRecalibrate: () => void;
  readonly onSnooze: () => void;
}

// 2c — inline nudge (never a modal), snooze 7d. Confidence tone routes through Ring's tone
// prop only — this file's name doesn't earn the tone-context exception for a raw token.
export function VoiceDriftNudge({ confidenceFrom, confidenceTo, onRecalibrate, onSnooze }: VoiceDriftNudgeProps) {
  return (
    <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Mono style={{ color: "var(--dim)" }}>soou como você?</Mono>
        <Chip tone="neutral">Confere</Chip>
        <Chip tone="danger">Nem tanto</Chip>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: 18,
          display: "flex",
          gap: 14,
          alignItems: "flex-start"
        }}
      >
        <Ring size={44} width={3} value={confidenceTo / 100} tone="warning">
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem" }}>{confidenceTo}</span>
        </Ring>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Serif size="1.15rem" lineHeight={1.35}>
            Sua voz parece ter mudado desde a calibração.
          </Serif>
          <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: 5, lineHeight: 1.6 }}>
            Foi o terceiro "nem tanto" seguido — a confiança caiu de {confidenceFrom} pra {confidenceTo}.
            Normal: a escrita de todo mundo evolui. Uma recalibração rápida (só as amostras que mudaram)
            realinha.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <Pill variant="primary" onClick={onRecalibrate} style={{ padding: "7px 16px", fontSize: "0.82rem" }}>
              Recalibrar agora →
            </Pill>
            <button
              type="button"
              onClick={onSnooze}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", alignSelf: "center" }}
            >
              <Mono style={{ color: "var(--dim)" }}>depois · não mostrar por 7 dias</Mono>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
