import { Mono, Panel, Pill, Ring, Serif } from "../primitives/index.js";

export interface DowngradeSurplusProps {
  readonly balance: number;
  readonly keptCredits: number;
  readonly surplusCredits: number;
  readonly fromPlan: string;
  readonly toPlan: string;
  readonly onConfirm: () => void;
  readonly onKeep?: () => void;
}

// 2e — confirmation dialog when the current balance exceeds the target plan's rollover cap.
export function DowngradeSurplus({ balance, keptCredits, surplusCredits, fromPlan, toPlan, onConfirm, onKeep }: DowngradeSurplusProps) {
  return (
    <Panel dialog style={{ padding: 26, maxWidth: 460, width: "100%" }}>
      <Mono eyebrow style={{ marginBottom: 10 }}>
        trocar plano · {fromPlan} → {toPlan}
      </Mono>

      <Serif size="1.5rem" lineHeight={1.25} style={{ marginBottom: 14 }}>
        Você tem mais créditos que o teto do {toPlan}.
      </Serif>

      <Panel style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", marginBottom: 14 }}>
        <Ring size={56} width={3} value={1}>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.95rem" }}>{balance}</span>
        </Ring>
        <div style={{ fontSize: "0.84rem", color: "var(--muted)", lineHeight: 1.7 }}>
          <span style={{ color: "var(--ink)" }}>{keptCredits}</span> continuam como créditos do plano
          <br />
          <span style={{ color: "var(--accent)" }}>{surplusCredits}</span> viram saldo avulso — sem
          validade, usados primeiro
        </div>
      </Panel>

      <div style={{ fontSize: "0.8rem", color: "var(--dim)", lineHeight: 1.6, marginBottom: 18 }}>
        Nada é confiscado. A partir do próximo ciclo, o rollover respeita o teto do {toPlan} ({keptCredits}).
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <Pill variant="secondary" onClick={onKeep}>Manter o {fromPlan}</Pill>
        <Pill variant="primary" onClick={onConfirm}>Confirmar downgrade →</Pill>
      </div>
    </Panel>
  );
}
