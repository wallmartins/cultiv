import { Mono } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface TopbarProps {
  readonly label: string;
  readonly creditsLabel: string;
  readonly onToggleTheme: () => void;
  readonly onToggleRail: () => void;
}

export function Topbar({ label, creditsLabel, onToggleTheme, onToggleRail }: TopbarProps) {
  const t = useMessages();
  return (
    <div className="workspace-topbar">
      <div className="topbar-left">
        <button type="button" className="icon-button rail-burger" onClick={onToggleRail} aria-label={t.shell.toggleHistory}>
          <span className="rail-burger-bar" />
          <span className="rail-burger-bar" />
        </button>
        <Mono as="span" className="topbar-label">
          {label}
        </Mono>
      </div>
      <div className="topbar-right">
        <span className="credits-pill">{creditsLabel}</span>
        <button type="button" className="icon-button" onClick={onToggleTheme} aria-label={t.shell.toggleTheme}>
          ◐
        </button>
      </div>
    </div>
  );
}
