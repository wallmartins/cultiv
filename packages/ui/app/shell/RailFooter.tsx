import { useState } from "react";
import { Ring } from "../primitives/index.js";

export interface RailFooterProps {
  readonly voiceConfidenceValue?: number;
  readonly onToggleCompanion: () => void;
  readonly avatarInitials: string;
  readonly onOpenVoiceProfile: () => void;
  readonly onOpenBilling: () => void;
  readonly onOpenSettings: () => void;
  readonly onLogout: () => void;
}

export function RailFooter({
  voiceConfidenceValue,
  onToggleCompanion,
  avatarInitials,
  onOpenVoiceProfile,
  onOpenBilling,
  onOpenSettings,
  onLogout
}: RailFooterProps) {
  return (
    <div className="rail-footer">
      <button type="button" className="rail-footer-voice" onClick={onToggleCompanion}>
        <Ring value={voiceConfidenceValue ?? 0} size={24} width={2.5} tone="accent" />
        <span className="rail-footer-voice-label">Sua voz</span>
      </button>
      <AvatarMenu
        initials={avatarInitials}
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
  readonly onOpenVoiceProfile: () => void;
  readonly onOpenBilling: () => void;
  readonly onOpenSettings: () => void;
  readonly onLogout: () => void;
}

function AvatarMenu({ initials, onOpenVoiceProfile, onOpenBilling, onOpenSettings, onLogout }: AvatarMenuProps) {
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
      >
        {initials}
      </button>
      {open ? (
        <div className="avatar-dropdown" role="menu">
          <button type="button" className="avatar-dropdown-item" role="menuitem" onClick={() => select(onOpenVoiceProfile)}>
            Perfil de voz
          </button>
          <button type="button" className="avatar-dropdown-item" role="menuitem" onClick={() => select(onOpenBilling)}>
            Planos &amp; billing
          </button>
          <button type="button" className="avatar-dropdown-item" role="menuitem" onClick={() => select(onOpenSettings)}>
            Configurações
          </button>
          <button type="button" className="avatar-dropdown-item" role="menuitem" onClick={() => select(onLogout)}>
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}
