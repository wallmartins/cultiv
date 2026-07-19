import type { ReactNode } from "react";
import { Panel } from "./Panel.js";
import { Rail, type RailProps } from "./Rail.js";
import type { ShellToastProps } from "./ShellToast.js";
import type { TopbarProps } from "./Topbar.js";
import type { ShellTheme } from "./types.js";
import type { VoiceCompanionProps } from "./VoiceCompanion.js";

export interface WorkspaceShellProps {
  readonly theme: ShellTheme;
  readonly locked: boolean;
  readonly railOpen: boolean;
  readonly onRailBackdropClick: () => void;
  readonly rail: RailProps;
  readonly topbar: TopbarProps;
  readonly companion: VoiceCompanionProps;
  readonly toast?: ShellToastProps;
  readonly children: ReactNode;
}

export function WorkspaceShell({
  theme,
  locked,
  railOpen,
  onRailBackdropClick,
  rail,
  topbar,
  companion,
  toast,
  children
}: WorkspaceShellProps) {
  const backdropClass = ["rail-backdrop", railOpen && "is-open"].filter(Boolean).join(" ");

  return (
    <div className="workspace-shell" data-surface="workspace" data-theme={theme}>
      <Rail {...rail} locked={locked} open={railOpen} />
      <div className={backdropClass} onClick={onRailBackdropClick} />
      <Panel topbar={topbar} toast={toast} companion={companion}>
        {children}
      </Panel>
    </div>
  );
}
