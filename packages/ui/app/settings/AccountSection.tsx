import { Avatar, Mono, Panel, Pill } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface AccountSectionProps {
  readonly name: string;
  readonly email: string;
  readonly avatarInitials: string;
  readonly avatarUrl?: string;
  readonly onLogout: () => void;
}

export function AccountSection({ name, email, avatarInitials, avatarUrl, onLogout }: AccountSectionProps) {
  const t = useMessages();
  return (
    <Panel className="settings-section">
      <Mono as="div" className="settings-section-eyebrow">
        {t.settings.accountEyebrow}
      </Mono>
      <div className="settings-identity-row">
        <span className="settings-avatar">
          <Avatar src={avatarUrl} initials={avatarInitials} />
        </span>
        <div className="settings-identity-body">
          <div className="settings-identity-name">{name}</div>
          <Mono as="div" className="settings-identity-meta">
            {email} · {t.settings.viaAuth0}
          </Mono>
        </div>
        <Pill variant="secondary" onClick={onLogout}>
          {t.settings.logout}
        </Pill>
      </div>
    </Panel>
  );
}
