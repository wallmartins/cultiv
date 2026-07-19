import { Mono, Panel, Pill, Ring, Serif, StatusDot, c, f, warningA } from "../primitives";

export function LowConfidenceReview() {
  return (
    <div
      style={{
        width: 680,
        background: c.frame,
        color: c.ink,
        fontFamily: f.body,
        padding: "36px 44px 44px",
        boxSizing: "border-box"
      }}
    >
      <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 18, margin: "0 auto" }}>
        <Mono label style={{ fontSize: "10.5px", color: c.accent }}>
          passo 6 de 7 · revisão
        </Mono>

        <Serif as="h1" size={30} lineHeight={1.15}>
          Deu pra te ler — mas ainda <em style={{ fontStyle: "italic" }}>embaçado</em>.
        </Serif>

        <Panel style={{ padding: 18, display: "flex", alignItems: "center", gap: 16 }}>
          <Ring size={72} r={31} width={3.5} frac={77.9 / (2 * Math.PI * 31)} stroke={c.warning}>
            <span style={{ fontSize: "1.2rem" }}>40</span>
          </Ring>
          <div style={{ fontSize: "0.88rem", color: c.muted, lineHeight: 1.6 }}>
            As amostras apontam em direções diferentes — dá pra gerar, mas os textos vão soar genéricos
            até a voz firmar.
          </div>
        </Panel>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            border: `1px solid ${c.line}`,
            borderRadius: 12,
            overflow: "hidden"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 16px",
              borderBottom: `1px solid ${c.line}`
            }}
          >
            <StatusDot tone="accent" size={6} />
            <span style={{ flex: 1, fontSize: "0.84rem", color: c.muted }}>
              Opinião sobre engenharia e times
            </span>
            <Mono style={{ fontSize: "10px", color: c.dim }}>forte</Mono>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 16px",
              borderBottom: `1px solid ${c.line}`
            }}
          >
            <StatusDot tone="accent" size={6} />
            <span style={{ flex: 1, fontSize: "0.84rem", color: c.muted }}>
              Algo que aprendi recentemente
            </span>
            <Mono style={{ fontSize: "10px", color: c.dim }}>forte</Mono>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 16px",
              borderBottom: `1px solid ${c.line}`,
              background: warningA(0.07)
            }}
          >
            <StatusDot tone="warning" size={6} />
            <span style={{ flex: 1, fontSize: "0.84rem" }}>
              Defenda uma posição{" "}
              <span style={{ color: c.muted }}>
                — soa como outra pessoa: mais formal, sem os seus exemplos
              </span>
            </span>
            <Pill
              variant="secondary"
              style={{
                borderColor: c.warning,
                color: c.warning,
                padding: "4px 11px",
                fontSize: "0.76rem",
                flex: "none"
              }}
            >
              Reescrever →
            </Pill>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px" }}>
            <StatusDot tone="accent" size={6} />
            <span style={{ flex: 1, fontSize: "0.84rem", color: c.muted }}>
              Explique algo que você sabe bem
            </span>
            <Mono style={{ fontSize: "10px", color: c.dim }}>ok</Mono>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <Mono style={{ color: c.dim, cursor: "pointer" }}>seguir com 40% mesmo assim →</Mono>
          <Pill variant="primary" style={{ padding: "10px 20px", fontSize: "0.88rem" }}>
            Reescrever a amostra 3 →
          </Pill>
        </div>
      </div>
    </div>
  );
}
