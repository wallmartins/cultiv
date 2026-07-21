import { Mono, Panel } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import { ConsentMirrorRow, type ConsentMirrorRowProps } from "./ConsentMirrorRow.js";
import { DeleteAccountRow, type DeleteAccountRowProps } from "./DeleteAccountRow.js";
import { ExportDataRow, type ExportDataRowProps } from "./ExportDataRow.js";
import { ResetAccountRow, type ResetAccountRowProps } from "./ResetAccountRow.js";

export interface PrivacyDataSectionProps {
  // undefined while the consent query is still loading — the row shows an in-flow placeholder
  // instead of a fabricated granted/revoked state.
  readonly consent?: ConsentMirrorRowProps;
  readonly exportData: ExportDataRowProps;
  readonly reset: ResetAccountRowProps;
  readonly delete: DeleteAccountRowProps;
}

// Design lines 408–414 group Export < Reset < Delete here (not Conta, where ADR 0005 §7 lists
// capability) — the escalating ladder reads as one contiguous block. Layout decision, not a
// product reopen (see breakdown-14 §"Contradição surfada").
export function PrivacyDataSection({ consent, exportData, reset, delete: deleteRow }: PrivacyDataSectionProps) {
  const t = useMessages();
  return (
    <Panel className="settings-section">
      <Mono as="div" className="settings-section-eyebrow">
        {t.settings.privacyEyebrow}
      </Mono>
      {consent ? (
        <ConsentMirrorRow {...consent} />
      ) : (
        <div className="settings-row">
          <div className="settings-row-text">
            <div className="settings-row-label">{t.settings.trainingConsentLabel}</div>
            <div className="settings-row-sub">{t.common.loading}</div>
          </div>
        </div>
      )}
      <ExportDataRow {...exportData} />
      <ResetAccountRow {...reset} />
      <DeleteAccountRow {...deleteRow} />
    </Panel>
  );
}
