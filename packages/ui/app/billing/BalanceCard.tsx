import { Mono, Panel, Ring } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface BalanceCardProps {
  readonly texts: number;
  readonly credits: number;
  readonly ringFraction: number;
  readonly renewLabel: string;
}

// Hero of the panel: "~N textos", never raw credits as the primary number (credits is secondary).
export function BalanceCard({ texts, credits, ringFraction, renewLabel }: BalanceCardProps) {
  const t = useMessages();
  return (
    <Panel style={{ display: "flex", alignItems: "center", gap: "var(--sp-lg)", padding: "var(--sp-lg)" }}>
      <Ring value={ringFraction} size={84} width={4} tone="accent">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "1.6rem", color: "var(--ink)" }}>~{texts}</span>
          <Mono style={{ color: "var(--dim)" }}>{t.billing.balanceUnit}</Mono>
        </div>
      </Ring>
      <div>
        <div style={{ fontFamily: "var(--font-ui)", fontSize: "1.1rem", color: "var(--ink)" }}>
          {t.common.credits(credits)}
        </div>
        <Mono style={{ color: "var(--muted)" }}>{renewLabel}</Mono>
      </div>
    </Panel>
  );
}
