import type { ReactNode } from "react";
import { ShellToast, type ShellToastProps } from "./ShellToast.js";
import { Topbar, type TopbarProps } from "./Topbar.js";
import { VoiceCompanion, type VoiceCompanionProps } from "./VoiceCompanion.js";

interface PanelProps {
  readonly topbar: TopbarProps;
  readonly toast?: ShellToastProps;
  readonly companion: VoiceCompanionProps;
  readonly children: ReactNode;
}

export function Panel({ topbar, toast, companion, children }: PanelProps) {
  return (
    <div className="workspace-panel">
      <div className="workspace-halo" />
      <Topbar {...topbar} />
      {toast ? <ShellToast {...toast} /> : null}
      <div className="workspace-body">
        <div className="workspace-center">{children}</div>
        <VoiceCompanion {...companion} />
      </div>
    </div>
  );
}
