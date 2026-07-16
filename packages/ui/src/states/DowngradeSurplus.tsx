import { Mono, Panel, Pill, Ring, Serif, c, f } from "../primitives";

// 2e — Downgrade com excedente. O saldo atual supera o teto do novo plano;
// nada é confiscado: parte vira crédito do plano, o excedente vira saldo avulso
// sem validade. Diálogo elevado com a matemática explícita.
export function DowngradeSurplus() {
  return (
    <div
      data-screen-label="2e Downgrade"
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
      <Panel dialog style={{ padding: 26, maxWidth: 460, width: "100%" }}>
        <Mono label style={{ marginBottom: 10 }}>
          trocar plano · Criador → Explorador
        </Mono>

        <Serif size="1.5rem" lineHeight={1.25} style={{ marginBottom: 14 }}>
          Você tem mais créditos que o teto do Explorador.
        </Serif>

        <Panel
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 16px",
            marginBottom: 14
          }}
        >
          <Ring size={56} r={24} width={3} frac={1}>
            <span style={{ fontSize: "0.95rem" }}>38</span>
          </Ring>
          <div style={{ fontSize: "0.84rem", color: c.muted, lineHeight: 1.7 }}>
            <span style={{ color: c.ink }}>15</span> continuam como créditos do plano
            <br />
            <span style={{ color: c.accent }}>23</span> viram saldo avulso — sem validade, usados
            primeiro
          </div>
        </Panel>

        <div style={{ fontSize: "0.8rem", color: c.dim, lineHeight: 1.6, marginBottom: 18 }}>
          Nada é confiscado. A partir do próximo ciclo, o rollover respeita o teto do Explorador
          (15).
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Pill variant="secondary">Manter o Criador</Pill>
          <Pill variant="primary">Confirmar downgrade →</Pill>
        </div>
      </Panel>
    </div>
  );
}
