import { useMessages } from "../i18n/index.js";
import { Mono, Pill, Serif } from "../primitives/index.js";

export interface RevokeConfirmDialogProps {
  readonly open: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function RevokeConfirmDialog({ open, onCancel, onConfirm }: RevokeConfirmDialogProps) {
  const t = useMessages();
  if (!open) return null;

  return (
    <div className="voice-revoke-backdrop" onClick={onCancel}>
      <div className="voice-revoke-dialog" onClick={(event) => event.stopPropagation()}>
        <Mono as="div" className="voice-revoke-dialog-eyebrow">
          {t.voice.revokeDialog.eyebrow}
        </Mono>
        <Serif as="div" size="1.5rem" lineHeight="1.25" className="voice-revoke-dialog-title">
          {t.voice.revokeDialog.title}
        </Serif>
        <div className="voice-revoke-dialog-body">{t.voice.revokeDialog.body}</div>
        <div className="voice-revoke-dialog-actions">
          <Pill variant="secondary" onClick={onCancel}>
            {t.voice.revokeDialog.cancel}
          </Pill>
          <Pill variant="danger" onClick={onConfirm}>
            {t.voice.revokeDialog.confirm}
          </Pill>
        </div>
      </div>
    </div>
  );
}
