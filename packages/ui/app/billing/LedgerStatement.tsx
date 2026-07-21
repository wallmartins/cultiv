import { Mono, Panel, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import { EmptyLedger } from "./EmptyLedger.js";
import { LedgerRow, type LedgerRowData } from "./LedgerRow.js";

export type { LedgerRowData } from "./LedgerRow.js";

export interface LedgerStatementProps {
  readonly rows: readonly LedgerRowData[];
  readonly loading?: boolean;
}

// Rows arrive already curated by the backend (LedgerStatementView) — this only lays them out,
// it never collapses reserve/capture/release itself.
export function LedgerStatement({ rows, loading = false }: LedgerStatementProps) {
  const t = useMessages();
  return (
    <div>
      <Serif as="h2" size="1.5rem" style={{ marginBottom: "var(--sp-md)" }}>
        {t.billing.extrato}
      </Serif>
      {loading ? (
        <Panel style={{ padding: "var(--sp-lg)", textAlign: "center" }}>
          <Mono style={{ color: "var(--dim)" }}>{t.billing.ledgerLoading}</Mono>
        </Panel>
      ) : rows.length === 0 ? (
        <EmptyLedger />
      ) : (
        <Panel style={{ padding: "0 var(--sp-lg)" }}>
          {rows.map((row, index) => (
            <div key={row.id} style={{ borderBottom: index < rows.length - 1 ? "1px solid var(--line)" : "none" }}>
              <LedgerRow amount={row.amount} tone={row.tone} label={row.label} sub={row.sub} date={row.date} />
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
