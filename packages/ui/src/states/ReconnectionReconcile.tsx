import { Banner, Mono, Pill, Ring, StatusDot, c, f, inkA } from "../primitives";

// 2a — Reconexão. Volta do offline: uma barra do estado anterior (riscada), a
// reconciliação em accent + glow ("aqui vai o que aconteceu") e a lista do que
// ficou pronto / retomou. Nada se perde: as gerações seguem no servidor.
export function ReconnectionReconcile() {
  return (
    <div
      data-screen-label="2a Reconexão"
      style={{
        width: 680,
        background: c.bg,
        color: c.ink,
        fontFamily: f.body,
        padding: "0 0 36px",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          background: c.surface,
          borderBottom: `1px solid ${c.line}`,
          padding: "9px 22px",
          display: "flex",
          alignItems: "center",
          gap: 9
        }}
      >
        <StatusDot tone="neutral" size={7} />
        <Mono style={{ color: c.dim, textDecoration: "line-through" }}>
          sem conexão — suas gerações continuam no servidor
        </Mono>
        <Mono style={{ fontSize: 10, color: c.dim, marginLeft: "auto" }}>estado anterior</Mono>
      </div>

      <div style={{ padding: "20px 44px 0" }}>
        <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>
          <Banner
            tone="accent"
            glow
            icon={<StatusDot tone="accent" size={7} style={{ marginTop: 6 }} />}
            action={
              <Pill
                variant="secondary"
                style={{
                  borderColor: c.accent,
                  color: c.accent,
                  padding: "7px 14px",
                  fontSize: "0.8rem",
                  whiteSpace: "nowrap"
                }}
              >
                Ver o pronto →
              </Pill>
            }
          >
            <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>De volta — aqui vai o que aconteceu</div>
            <div style={{ fontSize: "0.8rem", color: c.muted, marginTop: 3, lineHeight: 1.55 }}>
              Você ficou offline por 4 minutos. Nesse tempo,{" "}
              <span style={{ color: c.ink }}>"Roadmap trimestral" ficou pronto</span> e "Contratar
              sênior" segue escrevendo (78%).
            </div>
          </Banner>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div
              style={{
                padding: "9px 10px",
                borderRadius: 12,
                display: "flex",
                gap: 9,
                alignItems: "flex-start",
                background: inkA(0.04)
              }}
            >
              <StatusDot tone="accent" size={8} style={{ marginTop: 5 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "0.855rem" }}>Por que abandonei o roadmap trimestral</div>
                <Mono style={{ display: "block", marginTop: 4 }}>
                  pronto enquanto você estava offline · Médio
                </Mono>
              </div>
              <StatusDot tone="accent" size={7} style={{ marginTop: 5 }} />
            </div>

            <div
              style={{
                padding: "9px 10px",
                borderRadius: 12,
                display: "flex",
                gap: 9,
                alignItems: "flex-start"
              }}
            >
              <Ring size={16} r={6} width={2} frac={29.4 / (2 * Math.PI * 6)} style={{ marginTop: 2 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.855rem" }}>Contratar sênior vs. formar júnior</div>
                <Mono style={{ display: "block", marginTop: 4, color: c.accent, animation: "cvPulse 1.4s infinite" }}>
                  retomado · escrevendo… 78%
                </Mono>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
