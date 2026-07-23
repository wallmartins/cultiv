import { useState } from "react";
import { Avatar, Ring } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface RailFooterProps {
  readonly voiceConfidenceValue?: number;
  readonly onToggleCompanion: () => void;
  readonly avatarInitials: string;
  readonly avatarUrl?: string;
  readonly onOpenVoiceProfile: () => void;
  readonly onOpenBilling: () => void;
  readonly onOpenSettings: () => void;
  readonly onLogout: () => void;
}

export function RailFooter({
  voiceConfidenceValue,
  onToggleCompanion,
  avatarInitials,
  avatarUrl,
  onOpenVoiceProfile,
  onOpenBilling,
  onOpenSettings,
  onLogout
}: RailFooterProps) {
  const t = useMessages();
  return (
    <div className="rail-footer">
      <button type="button" className="rail-footer-voice" onClick={onToggleCompanion}>
        <Ring value={voiceConfidenceValue ?? 0} size={24} width={2.5} tone="accent" />
        <span className="rail-footer-voice-label">{t.shell.yourVoice}</span>
      </button>
      <AvatarMenu
        initials={avatarInitials}
        pictureUrl={avatarUrl}
        onOpenVoiceProfile={onOpenVoiceProfile}
        onOpenBilling={onOpenBilling}
        onOpenSettings={onOpenSettings}
        onLogout={onLogout}
      />
    </div>
  );
}

interface AvatarMenuProps {
  readonly initials: string;
  readonly pictureUrl?: string;
  readonly onOpenVoiceProfile: () => void;
  readonly onOpenBilling: () => void;
  readonly onOpenSettings: () => void;
  readonly onLogout: () => void;
}

function AvatarMenu({ initials, pictureUrl, onOpenVoiceProfile, onOpenBilling, onOpenSettings, onLogout }: AvatarMenuProps) {
  const t = useMessages();
  const [open, setOpen] = useState(false);
  const select = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <div className="avatar-menu">
      <button
        type="button"
        className="avatar-badge"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.shell.account}
      >
        <Avatar src={pictureUrl} initials={initials} />
      </button>
      {open ? (
        <div className="avatar-dropdown" role="menu">
          <button type="button" className="avatar-dropdown-item" role="menuitem" onClick={() => select(onOpenVoiceProfile)}>
            {t.shell.voiceProfile}
          </button>
          <button type="button" className="avatar-dropdown-item" role="menuitem" onClick={() => select(onOpenBilling)}>
            {t.shell.billing}
          </button>
          <button type="button" className="avatar-dropdown-item" role="menuitem" onClick={() => select(onOpenSettings)}>
            {t.shell.settings}
          </button>
          <button type="button" className="avatar-dropdown-item" role="menuitem" onClick={() => select(onLogout)}>
            {t.shell.logout}
          </button>
        </div>
      ) : null}
    </div>
  );
}
