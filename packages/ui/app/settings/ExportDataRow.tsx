import { Pill } from "../primitives/index.js";

export interface ExportDataRowProps {
  readonly pending: boolean;
  readonly onExport: () => void;
}

// Não-destrutivo — sem diálogo. Estado é só o Pill (em-andamento → pronto via toast, no container).
export function ExportDataRow({ pending, onExport }: ExportDataRowProps) {
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-label">Exportar meus dados</div>
        <div className="settings-row-sub">perfil de voz + exemplos + histórico + conta, num download único</div>
      </div>
      <Pill variant="secondary" onClick={onExport} disabled={pending}>
        {pending ? "Exportando…" : "Exportar"}
      </Pill>
    </div>
  );
}
