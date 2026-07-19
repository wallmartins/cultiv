import { Mono, Panel, Pill, Serif } from "../primitives/index.js";

export interface ResetDialogProps {
  readonly open: boolean;
  readonly pending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

// Escopo médio — sem type-to-confirm (esse degrau de fricção fica reservado ao DeleteDialog).
export function ResetDialog({ open, pending, onCancel, onConfirm }: ResetDialogProps) {
  if (!open) return null;

  return (
    <div className="settings-dialog-backdrop" onClick={onCancel}>
      <Panel dialog className="settings-dialog" onClick={(event) => event.stopPropagation()}>
        <Mono as="div" className="settings-dialog-eyebrow">
          ação destrutiva · escopo médio
        </Mono>
        <Serif as="div" size="1.5rem" lineHeight="1.25" className="settings-dialog-title">
          Resetar apaga tudo, menos o login
        </Serif>
        <div className="settings-dialog-body">
          Perfil de voz, exemplos da calibração e todo o histórico de gerações são apagados. Sua conta volta ao
          estado recém-criado e você cai de novo na calibração.
        </div>
        <div className="settings-dialog-actions">
          <Pill variant="secondary" onClick={onCancel} disabled={pending}>
            Cancelar
          </Pill>
          <Pill variant="danger" onClick={onConfirm} disabled={pending}>
            {pending ? "Resetando…" : "Resetar minha conta"}
          </Pill>
        </div>
      </Panel>
    </div>
  );
}
