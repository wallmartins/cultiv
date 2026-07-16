import { Pill, Ring, c, f } from "../primitives";

// 1d — Pendente e zerado. Créditos acabaram e a renovação do ciclo não passou.
// Anel danger com arco mínimo + rótulo "0 / CRÉDITOS". Compra avulsa fica
// desabilitada até regularizar o pagamento.
export function PaymentPendingZeroCredits() {
  return (
    <div
      data-screen-label="1d Pendente e zerado"
      style={{
        width: 680,
        background: c.bg,
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
      <Ring size={84} r={36} width={4} frac={8 / (2 * Math.PI * 36)} stroke={c.danger}>
        <span style={{ fontFamily: f.head, fontSize: "1.5rem", lineHeight: 1 }}>0</span>
        <span
          style={{
            fontFamily: f.mono,
            fontSize: 8,
            letterSpacing: "0.1em",
            color: c.muted,
            marginTop: 2
          }}
        >
          CRÉDITOS
        </span>
      </Ring>

      <h1
        style={{
          fontFamily: f.head,
          fontWeight: 400,
          fontSize: 30,
          lineHeight: 1.15,
          margin: 0,
          maxWidth: 420
        }}
      >
        Seus créditos acabaram — e a renovação não passou.
      </h1>

      <div style={{ fontSize: "0.88rem", color: c.muted, lineHeight: 1.6, maxWidth: 420 }}>
        Não conseguimos cobrar o Criador este mês. Regularizando, os 30 créditos do ciclo entram na
        hora. Sua voz e seu histórico estão intactos.
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
        <Pill variant="danger">Regularizar pagamento →</Pill>
        <Pill
          variant="secondary"
          disabled
          style={{ color: c.dim, padding: "10px 20px", fontSize: "0.86rem" }}
        >
          Comprar créditos avulsos
        </Pill>
      </div>

      <div style={{ fontFamily: f.mono, fontSize: 10, letterSpacing: "0.07em", color: c.dim }}>
        compra avulsa reabre depois de regularizar · dúvidas? suporte@cultiv.app
      </div>
    </div>
  );
}
