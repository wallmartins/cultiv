import { Pill } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface DeleteAccountRowProps {
  readonly onOpenDelete: () => void;
}

// Degrau terminal da escada destrutiva — label + Pill sólido, ambos em --danger em repouso.
export function DeleteAccountRow({ onOpenDelete }: DeleteAccountRowProps) {
  const t = useMessages();
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-label is-danger">{t.settings.deleteAccountLabel}</div>
        <div className="settings-row-sub">{t.settings.deleteAccountSub}</div>
      </div>
      <Pill variant="danger" onClick={onOpenDelete}>
        {t.settings.deleteAccountLabel}
      </Pill>
    </div>
  );
}
