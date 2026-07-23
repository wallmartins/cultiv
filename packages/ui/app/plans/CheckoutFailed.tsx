import { Panel, Pill, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface CheckoutFailedProps {
  readonly onRetry?: () => void;
  readonly onDismiss: () => void;
}

export function CheckoutFailed({ onRetry, onDismiss }: CheckoutFailedProps) {
  const t = useMessages();
  return (
    <Panel dialog className="checkout-overlay-panel">
      <span className="checkout-fail-badge">×</span>
      <Serif className="checkout-overlay-title" size="1.5rem">
        {t.plans.checkout.failed.title}
      </Serif>
      <div className="checkout-overlay-sub">{t.plans.checkout.failed.sub}</div>
      <div className="checkout-overlay-actions">
        <Pill variant="outline" onClick={onDismiss}>
          {t.plans.checkout.failed.dismiss}
        </Pill>
        {onRetry ? (
          <Pill variant="primary" onClick={onRetry}>
            {t.plans.checkout.failed.retry}
          </Pill>
        ) : null}
      </div>
    </Panel>
  );
}
