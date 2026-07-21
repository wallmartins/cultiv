import { Mono, Panel, Pill, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface DeleteDialogProps {
  readonly open: boolean;
  readonly confirmText: string;
  readonly onConfirmTextChange: (value: string) => void;
  readonly pending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

// Degrau terminal — type-to-confirm é a fricção que separa este diálogo do ResetDialog. The
// confirm word is sourced from t.settings.deleteConfirmWord (not a static export) so it stays
// locale-correct — the backend (account-service.ts) accepts both "EXCLUIR" and "DELETE".
export function DeleteDialog({ open, confirmText, onConfirmTextChange, pending, onCancel, onConfirm }: DeleteDialogProps) {
  const t = useMessages();
  if (!open) return null;
  const confirmWord = t.settings.deleteConfirmWord;
  const canConfirm = confirmText === confirmWord;
  const confirmLabel = t.settings.deleteDialogConfirmLabel(confirmWord);

  return (
    <div className="settings-dialog-backdrop" onClick={onCancel}>
      <Panel dialog className="settings-dialog is-delete" onClick={(event) => event.stopPropagation()}>
        <Mono as="div" className="settings-dialog-eyebrow">
          {t.settings.deleteDialogEyebrow}
        </Mono>
        <Serif as="div" size="1.5rem" lineHeight="1.25" className="settings-dialog-title">
          {t.settings.deleteDialogTitle}
        </Serif>
        <div className="settings-dialog-body">{t.settings.deleteDialogBody}</div>
        <div className="settings-dialog-confirm-field">
          <Mono as="div" className="settings-dialog-confirm-label">
            {confirmLabel}
          </Mono>
          <input
            className="settings-dialog-confirm-input"
            value={confirmText}
            onChange={(event) => onConfirmTextChange(event.target.value)}
            placeholder={confirmWord}
            aria-label={confirmLabel}
          />
        </div>
        <div className="settings-dialog-actions">
          <Pill variant="secondary" onClick={onCancel} disabled={pending}>
            {t.settings.keepAccount}
          </Pill>
          <Pill variant="danger" onClick={onConfirm} disabled={!canConfirm || pending}>
            {pending ? t.settings.deletingInProgress : t.settings.deleteForever}
          </Pill>
        </div>
      </Panel>
    </div>
  );
}
