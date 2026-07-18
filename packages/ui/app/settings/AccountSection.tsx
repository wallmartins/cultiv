import { Mono, Panel, Pill } from "../primitives/index.js";

export interface AccountSectionProps {
  readonly name: string;
  readonly email: string;
  readonly avatarInitials: string;
  readonly onLogout: () => void;
}

export function AccountSection({ name, email, avatarInitials, onLogout }: AccountSectionProps) {
  return (
    <Panel className="settings-section">
      <Mono as="div" className="settings-section-eyebrow">
        Conta
      </Mono>
      <div className="settings-identity-row">
        <span className="settings-avatar">{avatarInitials}</span>
        <div className="settings-identity-body">
          <div className="settings-identity-name">{name}</div>
          <Mono as="div" className="settings-identity-meta">
            {email} · via Auth0
          </Mono>
        </div>
        <Pill variant="secondary" onClick={onLogout}>
          Sair
        </Pill>
      </div>
    </Panel>
  );
}
