import { CheckoutFailed } from "./CheckoutFailed.js";
import { CheckoutPending } from "./CheckoutPending.js";
import { CheckoutRedirecting } from "./CheckoutRedirecting.js";
import { CheckoutSuccess } from "./CheckoutSuccess.js";
import type { CheckoutPhase } from "./types.js";

export interface CheckoutOverlayProps {
  readonly phase: CheckoutPhase | undefined;
}

export function CheckoutOverlay({ phase }: CheckoutOverlayProps) {
  if (!phase) return null;

  return (
    <div className="checkout-overlay">
      {phase.kind === "redirecting" ? <CheckoutRedirecting label={phase.label} meta={phase.meta} /> : null}
      {phase.kind === "success" ? (
        <CheckoutSuccess product={phase.product} itemLabel={phase.itemLabel} onDone={phase.onDone} />
      ) : null}
      {phase.kind === "pending" ? <CheckoutPending product={phase.product} onDone={phase.onDone} /> : null}
      {phase.kind === "failed" ? <CheckoutFailed onRetry={phase.onRetry} onDismiss={phase.onDismiss} /> : null}
    </div>
  );
}
