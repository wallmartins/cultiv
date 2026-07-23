import { Pill } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface ResetAccountRowProps {
  readonly onOpenReset: () => void;
}

// Escopo médio da escada — outline vermelho em repouso (não só no hover) marca o degrau
// intermediário entre Exportar (neutro) e Excluir (sólido).
export function ResetAccountRow({ onOpenReset }: ResetAccountRowProps) {
  const t = useMessages();
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-label">{t.settings.resetAccountLabel}</div>
        <div className="settings-row-sub">{t.settings.resetAccountSub}</div>
      </div>
      <Pill variant="outline" className="settings-reset-btn" onClick={onOpenReset}>
        {t.settings.resetButton}
      </Pill>
    </div>
  );
}
