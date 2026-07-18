import { Mono, Panel, Pill, Ring, Serif } from "../primitives/index.js";

export interface LongTimeoutWatchProps {
  readonly theme: string;
  readonly progress: number;
  readonly elapsed: string;
  readonly onCancel: () => void;
  readonly onWait: () => void;
}

// 1b — the live-progress view once the watch passes 2/5 min (breakdown-15 §1).
// The refund amount itself has no home on ExecutionStatusView (no reservedCredits/cost field —
// GAP registered in docs/live/plan/fase-b-gaps.md) — the copy stays honest instead of a fabricated number.
export function LongTimeoutWatch({ theme, progress, elapsed, onCancel, onWait }: LongTimeoutWatchProps) {
  return (
    <div
      style={{
        width: 680,
        background: "var(--bg)",
        backgroundImage: "radial-gradient(ellipse 400px 300px at 50% 40%, color-mix(in oklch, var(--accent) 6%, transparent), transparent 70%)",
        color: "var(--ink)",
        fontFamily: "var(--font-body)",
        padding: "48px 44px 52px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        textAlign: "center"
      }}
    >
      <Ring size={96} width={4} value={progress} pulse>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "1.5rem" }}>{Math.round(progress * 100)}%</span>
      </Ring>

      <Serif size="1.6rem">escrevendo com a sua voz…</Serif>

      <Mono>{theme} · {elapsed}</Mono>

      <Panel style={{ padding: "13px 18px", maxWidth: 400 }}>
        <div style={{ fontSize: "0.84rem", color: "var(--muted)", lineHeight: 1.6 }}>
          Está demorando mais que o normal. O texto continua sendo escrito — pode fechar esta tela que
          a gente avisa quando ficar pronto.
        </div>
      </Panel>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Pill variant="secondary" onClick={onCancel}>Cancelar e estornar os créditos reservados</Pill>
        <Pill variant="primary" onClick={onWait} style={{ padding: "8px 16px", fontSize: "0.84rem" }}>
          Continuar esperando →
        </Pill>
      </div>
    </div>
  );
}
