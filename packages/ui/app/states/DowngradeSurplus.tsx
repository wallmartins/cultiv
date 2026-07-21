import { Mono, Panel, Pill, Ring, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

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
  const t = useMessages();
  return (
    <Panel dialog style={{ padding: 26, maxWidth: 460, width: "100%" }}>
      <Mono eyebrow style={{ marginBottom: 10 }}>
        {t.states.downgradeSurplus.header(fromPlan, toPlan)}
      </Mono>

      <Serif size="1.5rem" lineHeight={1.25} style={{ marginBottom: 14 }}>
        {t.states.downgradeSurplus.heading(toPlan)}
      </Serif>

      <Panel style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", marginBottom: 14 }}>
        <Ring size={56} width={3} value={1}>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.95rem" }}>{balance}</span>
        </Ring>
        <div style={{ fontSize: "0.84rem", color: "var(--muted)", lineHeight: 1.7 }}>
          <span style={{ color: "var(--ink)" }}>{keptCredits}</span> {t.states.downgradeSurplus.keptLabel}
          <br />
          <span style={{ color: "var(--accent)" }}>{surplusCredits}</span> {t.states.downgradeSurplus.surplusLabel}
        </div>
      </Panel>

      <div style={{ fontSize: "0.8rem", color: "var(--dim)", lineHeight: 1.6, marginBottom: 18 }}>
        {t.states.downgradeSurplus.footnote(toPlan, keptCredits)}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <Pill variant="secondary" onClick={onKeep}>{t.states.downgradeSurplus.keep(fromPlan)}</Pill>
        <Pill variant="primary" onClick={onConfirm}>{t.states.downgradeSurplus.confirm}</Pill>
      </div>
    </Panel>
  );
}
