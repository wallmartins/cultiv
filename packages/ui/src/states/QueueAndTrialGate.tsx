import { Pill, Ring, Serif, StatusDot, c, f } from "../primitives";

// 2b — Fila e trial gate. A última geração do teste: o anel numerado ("1"),
// a fila viva (2 rodando agora) e a escolha honesta — guardar pra depois ou
// usar a última e entrar na fila. A voz e o histórico ficam; o limite é volume.
export function QueueAndTrialGate() {
  return (
    <div
      data-screen-label="2b Fila e trial"
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
      <div style={{ maxWidth: 560, width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.accent}`,
            borderRadius: 16,
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Ring size={34} r={14} width={3} frac={70.4 / (2 * Math.PI * 14)}>
              <span style={{ fontSize: "0.8rem" }}>1</span>
            </Ring>
            <Serif size="1.25rem" lineHeight={1.3}>
              Esta é a sua última geração do teste.
            </Serif>
          </div>

          <div style={{ fontSize: "0.84rem", color: c.muted, lineHeight: 1.6 }}>
            Depois dela, escrever de novo pede um plano. Sua voz e seu histórico ficam — o limite do
            teste é só volume.
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: f.mono,
              fontSize: "10.5px",
              letterSpacing: "0.07em",
              color: c.muted,
              borderTop: `1px solid ${c.line}`,
              paddingTop: 12
            }}
          >
            <StatusDot tone="accent" size={6} pulse />
            2 gerações rodando agora — esta entra na fila e começa em ~1 min
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Pill variant="secondary">Guardar pra depois</Pill>
            <Pill variant="primary">Usar a última e entrar na fila →</Pill>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <a
            href="#"
            style={{
              fontFamily: f.mono,
              fontSize: "10.5px",
              letterSpacing: "0.07em",
              color: c.accent,
              textDecoration: "none"
            }}
          >
            ver planos antes de decidir →
          </a>
        </div>
      </div>
    </div>
  );
}
