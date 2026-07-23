import { Mono } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface TopUpLinkProps {
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

export function TopUpLink({ onClick, disabled = false }: TopUpLinkProps) {
  const t = useMessages();
  return (
    <button type="button" className="top-up-link" onClick={onClick} disabled={disabled}>
      <Mono>{t.plans.topUpLink}</Mono>
    </button>
  );
}
