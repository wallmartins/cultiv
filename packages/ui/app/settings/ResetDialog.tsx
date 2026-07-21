import { Mono, Panel, Pill, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface ResetDialogProps {
  readonly open: boolean;
  readonly pending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

// Escopo médio — sem type-to-confirm (esse degrau de fricção fica reservado ao DeleteDialog).
export function ResetDialog({ open, pending, onCancel, onConfirm }: ResetDialogProps) {
  const t = useMessages();
  if (!open) return null;

  return (
    <div className="settings-dialog-backdrop" onClick={onCancel}>
      <Panel dialog className="settings-dialog" onClick={(event) => event.stopPropagation()}>
        <Mono as="div" className="settings-dialog-eyebrow">
          {t.settings.resetDialogEyebrow}
        </Mono>
        <Serif as="div" size="1.5rem" lineHeight="1.25" className="settings-dialog-title">
          {t.settings.resetDialogTitle}
        </Serif>
        <div className="settings-dialog-body">{t.settings.resetDialogBody}</div>
        <div className="settings-dialog-actions">
          <Pill variant="secondary" onClick={onCancel} disabled={pending}>
            {t.common.cancel}
          </Pill>
          <Pill variant="danger" onClick={onConfirm} disabled={pending}>
            {pending ? t.settings.resettingInProgress : t.settings.resetMyAccount}
          </Pill>
        </div>
      </Panel>
    </div>
  );
}
