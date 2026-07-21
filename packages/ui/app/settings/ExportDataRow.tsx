import { Pill } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface ExportDataRowProps {
  readonly pending: boolean;
  readonly onExport: () => void;
}

// Não-destrutivo — sem diálogo. Estado é só o Pill (em-andamento → pronto via toast, no container).
export function ExportDataRow({ pending, onExport }: ExportDataRowProps) {
  const t = useMessages();
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-label">{t.settings.exportDataLabel}</div>
        <div className="settings-row-sub">{t.settings.exportDataSub}</div>
      </div>
      <Pill variant="secondary" onClick={onExport} disabled={pending}>
        {pending ? t.settings.exportingInProgress : t.settings.exportButton}
      </Pill>
    </div>
  );
}
