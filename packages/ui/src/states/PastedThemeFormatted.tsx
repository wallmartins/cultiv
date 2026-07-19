import { Mono, Panel, Pill, Serif, StatusDot, c, f, accentA, inkA } from "../primitives";

export function PastedThemeFormatted() {
  const pasted = `## Ideia pro LinkedIn
**Por que times pequenos entregam mais**
- ver o post do Farley: https://exemplo.com/farley
- ligar com a lei de Brooks`;

  return (
    <div
      data-screen-label="2g Tema formatado"
      style={{
        width: 680,
        background: c.bg,
        color: c.ink,
        fontFamily: f.body,
        padding: "40px 44px",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center"
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}
      >
        <Panel style={{ borderRadius: 16, padding: "16px 16px 12px" }}>
          <div
            style={{
              fontFamily: f.mono,
              fontSize: "0.8rem",
              lineHeight: 1.7,
              color: inkA(0.75),
              whiteSpace: "pre-wrap"
            }}
          >
            {pasted}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 8
            }}
          >
            <Mono style={{ color: c.dim }}>colado de outro lugar? a gente organiza</Mono>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: c.accent,
                color: c.onAccent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                cursor: "pointer"
              }}
            >
              →
            </span>
          </div>
        </Panel>

        <Panel style={{ border: `1px solid ${accentA(0.5)}`, borderRadius: 16, padding: 16 }}>
          <Mono label style={{ color: c.accent, marginBottom: 8 }}>
            entendi assim — confirma?
          </Mono>
          <Serif size="1.15rem" lineHeight={1.4}>
            Por que times pequenos entregam mais
          </Serif>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                fontSize: "0.82rem",
                color: c.muted
              }}
            >
              <StatusDot tone="accent" size={5} style={{ transform: "translateY(-2px)" }} />
              canal detectado: LinkedIn
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                fontSize: "0.82rem",
                color: c.muted
              }}
            >
              <StatusDot tone="accent" size={5} style={{ transform: "translateY(-2px)" }} />
              ângulos: post do Farley · lei de Brooks
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                fontSize: "0.82rem",
                color: c.muted
              }}
            >
              <StatusDot tone="neutral" size={5} style={{ transform: "translateY(-2px)" }} />1 link
              guardado como referência — não vamos abrir, só citar se você pedir
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 14,
              flexWrap: "wrap"
            }}
          >
            <Mono style={{ color: c.dim, cursor: "pointer", alignSelf: "center" }}>
              usar o texto como colei
            </Mono>
            <Pill variant="primary">Confirmar e seguir →</Pill>
          </div>
        </Panel>
      </div>
    </div>
  );
}
