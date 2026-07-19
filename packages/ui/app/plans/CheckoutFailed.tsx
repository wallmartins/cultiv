import { Panel, Pill, Serif } from "../primitives/index.js";

export interface CheckoutFailedProps {
  readonly onRetry?: () => void;
  readonly onDismiss: () => void;
}

export function CheckoutFailed({ onRetry, onDismiss }: CheckoutFailedProps) {
  return (
    <Panel dialog className="checkout-overlay-panel">
      <span className="checkout-fail-badge">×</span>
      <Serif className="checkout-overlay-title" size="1.5rem">
        O pagamento não passou.
      </Serif>
      <div className="checkout-overlay-sub">Nada foi cobrado. Confira os dados do cartão ou tente outro método.</div>
      <div className="checkout-overlay-actions">
        <Pill variant="outline" onClick={onDismiss}>
          Agora não
        </Pill>
        {onRetry ? (
          <Pill variant="primary" onClick={onRetry}>
            Tentar de novo →
          </Pill>
        ) : null}
      </div>
    </Panel>
  );
}
