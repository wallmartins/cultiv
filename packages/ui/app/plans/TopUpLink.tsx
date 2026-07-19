import { Mono } from "../primitives/index.js";

export interface TopUpLinkProps {
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

export function TopUpLink({ onClick, disabled = false }: TopUpLinkProps) {
  return (
    <button type="button" className="top-up-link" onClick={onClick} disabled={disabled}>
      <Mono>precisa de poucos créditos? compra avulsa →</Mono>
    </button>
  );
}
