import { useMessages } from "../i18n/index.js";

export interface ConsentMirrorRowProps {
  readonly granted: boolean;
  readonly sinceLabel: string;
  readonly onGoVoice: () => void;
}

// Read-only mirror — the SSOT (grant/revoke action) lives at /app/voice (ADR 0005 §4). This row
// only reflects state + deep-links there.
export function ConsentMirrorRow({ granted, sinceLabel, onGoVoice }: ConsentMirrorRowProps) {
  const t = useMessages();
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-label">{t.settings.trainingConsentLabel}</div>
        <div className={granted ? "settings-row-sub" : "settings-row-sub is-revoked"}>
          {granted ? t.settings.consentGrantedSub(sinceLabel) : t.settings.consentRevokedSub}
        </div>
      </div>
      <button type="button" className="settings-deep-link" onClick={onGoVoice}>
        {t.settings.manageInVoice}
      </button>
    </div>
  );
}
