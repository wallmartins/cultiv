import { Panel, Pill, StatusDot } from "../primitives/index.js";

export interface ConsentPanelProps {
  readonly state: "granted" | "revoked";
  readonly sinceLabel: string;
  readonly onRevoke: () => void;
  readonly onGrant: () => void;
}

export function ConsentPanel({ state, sinceLabel, onRevoke, onGrant }: ConsentPanelProps) {
  const granted = state === "granted";

  return (
    <Panel className="voice-consent-panel">
      <StatusDot tone={granted ? "accent" : "danger"} />
      <div className="voice-consent-body">
        <div className={granted ? "voice-consent-title" : "voice-consent-title is-revoked"}>
          {granted ? "Consentimento de treino concedido" : "Consentimento revogado"}
        </div>
        <div className="voice-consent-meta">
          {granted
            ? `${sinceLabel} · seus textos são usados só pra modelar a sua voz`
            : "o perfil de voz foi apagado e a geração está desligada"}
        </div>
      </div>
      {granted ? (
        <Pill variant="outline" className="voice-consent-revoke-btn" onClick={onRevoke}>
          Revogar
        </Pill>
      ) : (
        <Pill variant="primary" onClick={onGrant}>
          Conceder de novo
        </Pill>
      )}
    </Panel>
  );
}
