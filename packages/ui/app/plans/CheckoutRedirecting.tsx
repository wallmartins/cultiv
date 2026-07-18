import { Mono, Panel, Ring, Serif } from "../primitives/index.js";

export interface CheckoutRedirectingProps {
  readonly label: string;
  readonly meta?: string;
}

export function CheckoutRedirecting({ label, meta }: CheckoutRedirectingProps) {
  return (
    <Panel dialog className="checkout-overlay-panel">
      <Ring value={0.15} size={72} width={3.5} tone="accent" pulse />
      <Serif className="checkout-overlay-title" size="1.4rem">
        {label}
      </Serif>
      {meta ? <Mono className="checkout-overlay-meta">{meta}</Mono> : null}
    </Panel>
  );
}
