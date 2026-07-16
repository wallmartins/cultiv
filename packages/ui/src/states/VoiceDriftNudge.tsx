import { Chip, Mono, Pill, Ring, Serif, c, f } from "../primitives";

// 2c — Voz degradando. Três "nem tanto" seguidos derrubaram a confiança (78→65).
// Feedback honesto (âmbar) + convite a recalibrar só as amostras que mudaram.
// A escrita de todo mundo evolui; realinhar é rápido.
export function VoiceDriftNudge() {
  return (
    <div
      data-screen-label="2c Voz degradando"
      style={{
        width: 680,
        background: c.bg,
        color: c.ink,
        fontFamily: f.body,
        padding: "36px 44px 40px",
        boxSizing: "border-box"
      }}
    >
      <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Mono style={{ color: c.dim }}>soou como você?</Mono>
          <Chip tone="neutral">Confere</Chip>
          <Chip tone="danger">Nem tanto</Chip>
        </div>

        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.line}`,
            borderRadius: 16,
            padding: 18,
            display: "flex",
            gap: 14,
            alignItems: "flex-start"
          }}
        >
          <Ring size={44} r={18.5} width={3} frac={75.6 / (2 * Math.PI * 18.5)} stroke={c.warning}>
            <span style={{ fontSize: "0.85rem" }}>65</span>
          </Ring>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Serif size="1.15rem" lineHeight={1.35}>
              Sua voz parece ter mudado desde a calibração.
            </Serif>
            <div style={{ fontSize: "0.82rem", color: c.muted, marginTop: 5, lineHeight: 1.6 }}>
              Foi o terceiro "nem tanto" seguido — a confiança caiu de 78 pra 65. Normal: a escrita de
              todo mundo evolui. Uma recalibração rápida (só as amostras que mudaram) realinha.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <Pill variant="primary" style={{ padding: "7px 16px", fontSize: "0.82rem" }}>
                Recalibrar agora →
              </Pill>
              <Mono style={{ color: c.dim, cursor: "pointer", alignSelf: "center" }}>
                depois · não mostrar por 7 dias
              </Mono>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
