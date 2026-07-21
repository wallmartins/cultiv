import { useMessages } from "../i18n/index.js";
import { Panel, Pill, StatusDot } from "../primitives/index.js";

export interface ConsentPanelProps {
  readonly state: "granted" | "revoked";
  readonly sinceLabel: string;
  readonly onRevoke: () => void;
  readonly onGrant: () => void;
}

export function ConsentPanel({ state, sinceLabel, onRevoke, onGrant }: ConsentPanelProps) {
  const t = useMessages();
  const granted = state === "granted";

  return (
    <Panel className="voice-consent-panel">
      <StatusDot tone={granted ? "accent" : "danger"} />
      <div className="voice-consent-body">
        <div className={granted ? "voice-consent-title" : "voice-consent-title is-revoked"}>
          {granted ? t.voice.consent.grantedTitle : t.voice.consent.revokedTitle}
        </div>
        <div className="voice-consent-meta">
          {granted ? t.voice.consent.grantedMeta(sinceLabel) : t.voice.consent.revokedMeta}
        </div>
      </div>
      {granted ? (
        <Pill variant="outline" className="voice-consent-revoke-btn" onClick={onRevoke}>
          {t.voice.consent.revoke}
        </Pill>
      ) : (
        <Pill variant="primary" onClick={onGrant}>
          {t.voice.consent.grantAgain}
        </Pill>
      )}
    </Panel>
  );
}
