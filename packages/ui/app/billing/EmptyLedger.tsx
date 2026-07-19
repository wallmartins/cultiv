import { Mono, Panel } from "../primitives/index.js";

export function EmptyLedger() {
  return (
    <Panel style={{ padding: "var(--sp-lg)", textAlign: "center" }}>
      <Mono style={{ color: "var(--dim)" }}>nada por aqui ainda</Mono>
    </Panel>
  );
}
