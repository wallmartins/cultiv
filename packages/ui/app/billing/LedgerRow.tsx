import { Mono } from "../primitives/index.js";

export type LedgerRowTone = "credit" | "debit" | "expire";

export interface LedgerRowData {
  readonly id: string;
  readonly amount: string;
  readonly tone: LedgerRowTone;
  readonly label: string;
  readonly sub?: string;
  readonly date: string;
}

const AMOUNT_COLOR: Record<LedgerRowTone, string> = {
  credit: "var(--accent)",
  debit: "var(--ink)",
  expire: "var(--dim)"
};

export function LedgerRow({ amount, tone, label, sub, date }: Omit<LedgerRowData, "id">) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)", padding: "var(--sp-sm) 0" }}>
      <span style={{ fontFamily: "var(--font-ui)", width: 44, flex: "none", color: AMOUNT_COLOR[tone] }}>{amount}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.86rem", color: "var(--ink)" }}>{label}</div>
        {sub ? (
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--dim)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
      <Mono style={{ color: "var(--dim)", flex: "none" }}>{date}</Mono>
    </div>
  );
}
