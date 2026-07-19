import { Mono, Panel, Pill, Serif } from "../primitives/index.js";

// Único ponto de verdade da palavra de confirmação — o container reusa esta constante em vez
// de duplicar o literal.
export const DELETE_CONFIRM_WORD = "EXCLUIR";

export interface DeleteDialogProps {
  readonly open: boolean;
  readonly confirmText: string;
  readonly onConfirmTextChange: (value: string) => void;
  readonly pending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

// Degrau terminal — type-to-confirm é a fricção que separa este diálogo do ResetDialog.
export function DeleteDialog({ open, confirmText, onConfirmTextChange, pending, onCancel, onConfirm }: DeleteDialogProps) {
  if (!open) return null;
  const canConfirm = confirmText === DELETE_CONFIRM_WORD;

  return (
    <div className="settings-dialog-backdrop" onClick={onCancel}>
      <Panel dialog className="settings-dialog is-delete" onClick={(event) => event.stopPropagation()}>
        <Mono as="div" className="settings-dialog-eyebrow">
          ação terminal · sem volta
        </Mono>
        <Serif as="div" size="1.5rem" lineHeight="1.25" className="settings-dialog-title">
          Excluir a conta remove tudo — inclusive o login
        </Serif>
        <div className="settings-dialog-body">
          Voz, exemplos, histórico, dados de pagamento e o acesso. Não há recuperação. Se quiser só recomeçar, use
          "Resetar conta".
        </div>
        <div className="settings-dialog-confirm-field">
          <Mono as="div" className="settings-dialog-confirm-label">
            digite EXCLUIR pra confirmar
          </Mono>
          <input
            className="settings-dialog-confirm-input"
            value={confirmText}
            onChange={(event) => onConfirmTextChange(event.target.value)}
            placeholder={DELETE_CONFIRM_WORD}
            aria-label="digite EXCLUIR pra confirmar"
          />
        </div>
        <div className="settings-dialog-actions">
          <Pill variant="secondary" onClick={onCancel} disabled={pending}>
            Manter minha conta
          </Pill>
          <Pill variant="danger" onClick={onConfirm} disabled={!canConfirm || pending}>
            {pending ? "Excluindo…" : "Excluir pra sempre"}
          </Pill>
        </div>
      </Panel>
    </div>
  );
}
