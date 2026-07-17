import { Pill, Ring, StatusDot, c, f } from "../primitives";

export function PostResetReturn() {
  return (
    <div
      data-screen-label="1e Pós-reset"
      style={{
        width: 680,
        background: c.frame,
        color: c.ink,
        fontFamily: f.body,
        padding: 44,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        textAlign: "center"
      }}
    >
      <Ring size={44} r={19} width={3} frac={0.72} />

      <h1
        style={{
          fontFamily: f.head,
          fontWeight: 400,
          fontSize: 32,
          lineHeight: 1.15,
          margin: 0,
          maxWidth: 440
        }}
      >
        De volta ao começo, Rafael.
      </h1>

      <div style={{ fontSize: "0.88rem", color: c.muted, lineHeight: 1.6, maxWidth: 420 }}>
        Sua conta foi resetada em 10/07: voz, exemplos e histórico foram apagados. Seu login e seu
        plano continuam os mesmos.
      </div>

      <div
        style={{
          background: c.bg,
          border: `1px solid ${c.line}`,
          borderRadius: 12,
          padding: "14px 18px",
          maxWidth: 420,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          textAlign: "left"
        }}
      >
        <StatusDot tone="accent" size={7} style={{ marginTop: 6 }} />
        <div style={{ fontSize: "0.84rem", color: c.muted, lineHeight: 1.6 }}>
          Da última vez você escrevia sobre{" "}
          <span style={{ color: c.ink }}>engenharia de software e times</span>, para{" "}
          <span style={{ color: c.ink }}>líderes técnicos</span>. Quer partir daí ou começar do
          zero?
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center"
        }}
      >
        <Pill variant="secondary" style={{ padding: "10px 20px", fontSize: "0.86rem" }}>
          Começar do zero
        </Pill>
        <Pill variant="primary" style={{ padding: "10px 22px", fontSize: "0.9rem" }}>
          Recalibrar com esse contexto →
        </Pill>
      </div>
    </div>
  );
}
