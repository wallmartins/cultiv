import { Panel, Pill, Serif } from "../primitives/index.js";
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

// Mirrors CheckoutSuccess's per-product COPY table — a subscriber topping up isn't "usando o
// teste" (trial framing only fits a not-yet-subscribed checkout).
const COPY: Record<CheckoutProductKind, string> = {
  subscription: "Pix e boleto podem levar alguns minutos. Avisamos assim que confirmar — pode continuar usando o teste.",
  topup: "Pix e boleto podem levar alguns minutos. Avisamos assim que confirmar — seus créditos entram na conta na hora."
};

export function CheckoutPending({ product, onDone }: CheckoutPendingProps) {
  return (
    <Panel dialog className="checkout-overlay-panel">
      <DashedRing />
      <Serif className="checkout-overlay-title" size="1.5rem">
        Pagamento em análise.
      </Serif>
      <div className="checkout-overlay-sub">{COPY[product]}</div>
      <div className="checkout-overlay-actions">
        <Pill variant="outline" onClick={onDone}>
          Voltar ao app →
        </Pill>
      </div>
    </Panel>
  );
}
