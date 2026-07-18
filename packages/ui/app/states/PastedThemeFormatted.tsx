import { Mono, Panel, Pill, Serif, StatusDot } from "../primitives/index.js";

export interface PastedThemeFormattedProps {
  readonly pasted: string;
  readonly title: string;
  readonly channel: string;
  readonly angles: readonly string[];
  readonly linkCount: number;
  readonly onUseAsPasted: () => void;
  readonly onConfirm: () => void;
}

// 2g — sub-fluxo do composer ao colar markdown: limpa e ecoa o entendido. Links são referência,
// nunca seguidos.
export function PastedThemeFormatted({ pasted, title, channel, angles, linkCount, onUseAsPasted, onConfirm }: PastedThemeFormattedProps) {
  return (
    <div style={{ maxWidth: 560, width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      <Panel style={{ borderRadius: 16, padding: "16px 16px 12px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            lineHeight: 1.7,
            color: "color-mix(in oklch, var(--ink) 75%, transparent)",
            whiteSpace: "pre-wrap"
          }}
        >
          {pasted}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <Mono style={{ color: "var(--dim)" }}>colado de outro lugar? a gente organiza</Mono>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: "none",
              background: "var(--accent)",
              color: "var(--on-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              cursor: "pointer"
            }}
          >
            →
          </button>
        </div>
      </Panel>

      <Panel style={{ border: "1px solid color-mix(in oklch, var(--accent) 50%, transparent)", borderRadius: 16, padding: 16 }}>
        <Mono eyebrow style={{ marginBottom: 8 }}>entendi assim — confirma?</Mono>
        <Serif size="1.15rem" lineHeight={1.4}>{title}</Serif>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: "0.82rem", color: "var(--muted)" }}>
            <StatusDot tone="accent" size={5} style={{ transform: "translateY(-2px)" }} />
            canal detectado: {channel}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: "0.82rem", color: "var(--muted)" }}>
            <StatusDot tone="accent" size={5} style={{ transform: "translateY(-2px)" }} />
            ângulos: {angles.join(" · ")}
          </div>
          {linkCount > 0 ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: "0.82rem", color: "var(--muted)" }}>
              <StatusDot tone="neutral" size={5} style={{ transform: "translateY(-2px)" }} />
              {linkCount} link{linkCount === 1 ? "" : "s"} guardado{linkCount === 1 ? "" : "s"} como referência — não vamos abrir, só citar se você pedir
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14, flexWrap: "wrap" }}>
          <button type="button" onClick={onUseAsPasted} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", alignSelf: "center" }}>
            <Mono style={{ color: "var(--dim)" }}>usar o texto como colei</Mono>
          </button>
          <Pill variant="primary" onClick={onConfirm}>Confirmar e seguir →</Pill>
        </div>
      </Panel>
    </div>
  );
}
