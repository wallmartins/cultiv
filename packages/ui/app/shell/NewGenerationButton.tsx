import { Pill } from "../primitives/index.js";

export interface NewGenerationButtonProps {
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

export function NewGenerationButton({ onClick, disabled = false }: NewGenerationButtonProps) {
  return (
    <Pill variant="primary" className="wide" onClick={onClick} disabled={disabled}>
      ＋ Nova geração
    </Pill>
  );
}
