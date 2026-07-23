import { Mono, Panel } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export function EmptyLedger() {
  const t = useMessages();
  return (
    <Panel style={{ padding: "var(--sp-lg)", textAlign: "center" }}>
      <Mono style={{ color: "var(--dim)" }}>{t.billing.emptyLedger}</Mono>
    </Panel>
  );
}
