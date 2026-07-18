export interface ConsentMirrorRowProps {
  readonly granted: boolean;
  readonly sinceLabel: string;
  readonly onGoVoice: () => void;
}

// Read-only mirror — the SSOT (grant/revoke action) lives at /app/voice (ADR 0005 §4). This row
// only reflects state + deep-links there.
export function ConsentMirrorRow({ granted, sinceLabel, onGoVoice }: ConsentMirrorRowProps) {
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-label">Consentimento de treino</div>
        <div className={granted ? "settings-row-sub" : "settings-row-sub is-revoked"}>
          {granted ? `concedido ${sinceLabel} — o controle mora no perfil de voz` : "revogado — a geração está desligada"}
        </div>
      </div>
      <button type="button" className="settings-deep-link" onClick={onGoVoice}>
        gerenciar na voz →
      </button>
    </div>
  );
}
