import { Panel, Pill, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import type { CheckoutProductKind } from "./types.js";

export interface CheckoutPendingProps {
  readonly product: CheckoutProductKind;
  readonly onDone: () => void;
}

// A dashed, pulsing ring — Ring (primitives) only draws a value-based progress arc, not a
// dashed circle, so this stays a small dedicated SVG rather than stretching that primitive.
function DashedRing() {
  return (
    <svg width={72} height={72} viewBox="0 0 72 72" className="checkout-ring-dashed">
      <circle cx={36} cy={36} r={31} fill="none" strokeWidth={3.5} strokeDasharray="6 9" strokeLinecap="round" />
    </svg>
  );
}

export function CheckoutPending({ product, onDone }: CheckoutPendingProps) {
  const t = useMessages();
  return (
    <Panel dialog className="checkout-overlay-panel">
      <DashedRing />
      <Serif className="checkout-overlay-title" size="1.5rem">
        {t.plans.checkout.pending.title}
      </Serif>
      <div className="checkout-overlay-sub">{t.plans.checkout.pending.copy[product]}</div>
      <div className="checkout-overlay-actions">
        <Pill variant="outline" onClick={onDone}>
          {t.plans.checkout.pending.done}
        </Pill>
      </div>
    </Panel>
  );
}
