import { Pill } from "../primitives/index.js";

export interface ResetAccountRowProps {
  readonly onOpenReset: () => void;
}

// Escopo médio da escada — outline vermelho em repouso (não só no hover) marca o degrau
// intermediário entre Exportar (neutro) e Excluir (sólido).
export function ResetAccountRow({ onOpenReset }: ResetAccountRowProps) {
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-label">Resetar conta</div>
        <div className="settings-row-sub">apaga voz, exemplos e histórico — mantém o login e volta ao início</div>
      </div>
      <Pill variant="outline" className="settings-reset-btn" onClick={onOpenReset}>
        Resetar
      </Pill>
    </div>
  );
}
