import { Mono, Panel, Pill, Ring, Serif, c, f } from "../primitives";

export function RecalibrateWithRunning() {
  return (
    <div
      data-screen-label="2d Recalibrar com fila"
      style={{
        width: 680,
        fontFamily: f.body,
        boxSizing: "border-box",
        padding: "40px 44px",
        background: c.bg,
        color: c.ink,
        display: "flex",
        justifyContent: "center"
      }}
    >
      <Panel dialog style={{ padding: 26, maxWidth: 440, width: "100%" }}>
        <Mono label style={{ marginBottom: 10 }}>
          recalibrar · voz v3 → v4
        </Mono>

        <Serif size="1.5rem" lineHeight={1.25} style={{ marginBottom: 12 }}>
          Você tem 2 textos sendo escritos agora.
        </Serif>

        <div
          style={{
            fontSize: "0.88rem",
            color: c.muted,
            lineHeight: 1.6,
            marginBottom: 16
          }}
        >
          Eles terminam com a voz atual (v3) — nada é interrompido. Tudo o que você gerar depois da
          recalibração usa a v4. O histórico marca a versão de cada texto.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: "0.82rem",
              color: c.muted
            }}
          >
            <Ring size={14} r={5} width={2} frac={19.5 / (2 * Math.PI * 5)} />
            Contratar sênior vs. formar júnior
            <span style={{ fontFamily: f.mono, fontSize: 9.5, color: c.dim, marginLeft: "auto" }}>
              termina na v3
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: "0.82rem",
              color: c.muted
            }}
          >
            <Ring size={14} r={5} width={2} frac={9.4 / (2 * Math.PI * 5)} />
            Newsletter: edição sobre foco
            <span style={{ fontFamily: f.mono, fontSize: 9.5, color: c.dim, marginLeft: "auto" }}>
              termina na v3
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Pill variant="secondary">Esperar terminarem</Pill>
          <Pill variant="primary">Recalibrar agora →</Pill>
        </div>
      </Panel>
    </div>
  );
}
