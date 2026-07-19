import { Mono, Panel, Pill, Ring, Serif, accentA, c, f } from "../primitives";

export function LongTimeoutWatch() {
  return (
    <div
      style={{
        width: 680,
        backgroundColor: c.bg,
        backgroundImage: `radial-gradient(ellipse 400px 300px at 50% 40%, ${accentA(0.06)}, transparent 70%)`,
        color: c.ink,
        fontFamily: f.body,
        padding: "48px 44px 52px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        textAlign: "center"
      }}
    >
      <Ring size={96} r={42} width={4} frac={219 / (2 * Math.PI * 42)} pulse>
        <span style={{ fontSize: "1.5rem" }}>83%</span>
      </Ring>

      <Serif size="1.6rem">escrevendo com a sua voz…</Serif>

      <Mono>Por que abandonei o roadmap trimestral · há 5 min</Mono>

      <Panel style={{ padding: "13px 18px", maxWidth: 400 }}>
        <div style={{ fontSize: "0.84rem", color: c.muted, lineHeight: 1.6 }}>
          Está demorando mais que o normal. O texto continua sendo escrito — pode fechar esta tela que
          a gente avisa quando ficar pronto.
        </div>
      </Panel>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Pill variant="secondary">Cancelar e estornar 2 créditos</Pill>
        <Pill variant="primary" style={{ padding: "8px 16px", fontSize: "0.84rem" }}>
          Continuar esperando →
        </Pill>
      </div>
    </div>
  );
}
