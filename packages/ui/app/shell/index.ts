// Public surface of the workspace shell — only the composition root + the shared data shapes
// the container needs to build its props. Subcomponents (Rail, Panel, Topbar, …) stay internal
// so their Props types never collide with packages/ui/app/primitives' own (e.g. Panel/PanelProps).
export { WorkspaceShell, type WorkspaceShellProps } from "./WorkspaceShell.js";
export type { RailProps } from "./Rail.js";
export type { TopbarProps } from "./Topbar.js";
export type { ShellToastProps } from "./ShellToast.js";
export type { VoiceCompanionProps } from "./VoiceCompanion.js";
export type {
  HistoryGroupData,
  HistoryItemData,
  HistoryItemMetaTone,
  HistoryItemVisual,
  HistoryStatusFilterUI,
  RailEmptyReason,
  ShellTheme,
  VoiceCompanionContent
} from "./types.js";
