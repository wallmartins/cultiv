import { Panel, Pill, Ring, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import type { CheckoutProductKind } from "./types.js";

export interface CheckoutSuccessProps {
  readonly product: CheckoutProductKind;
  readonly itemLabel: string;
  readonly onDone: () => void;
}

export function CheckoutSuccess({ product, itemLabel, onDone }: CheckoutSuccessProps) {
  const t = useMessages();
  const copy = t.plans.checkout.success[product];

  return (
    <Panel dialog className="checkout-overlay-panel">
      <Ring value={1} size={72} width={3.5} tone="accent" style={{ filter: "drop-shadow(var(--glow-soft))" }}>
        <span className="num" style={{ color: "var(--accent)" }}>
          ✓
        </span>
      </Ring>
      <Serif className="checkout-overlay-title" size="1.5rem">
        {copy.title}
      </Serif>
      <div className="checkout-overlay-sub">{copy.sub(itemLabel)}</div>
      <div className="checkout-overlay-actions">
        <Pill variant="primary" onClick={onDone}>
          {t.plans.checkout.success.done}
        </Pill>
      </div>
    </Panel>
  );
}
