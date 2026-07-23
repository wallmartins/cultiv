import { Pill } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface NewGenerationButtonProps {
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

export function NewGenerationButton({ onClick, disabled = false }: NewGenerationButtonProps) {
  const t = useMessages();
  return (
    <Pill variant="primary" className="wide" onClick={onClick} disabled={disabled}>
      {t.shell.newGeneration}
    </Pill>
  );
}
