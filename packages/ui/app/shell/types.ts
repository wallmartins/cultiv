import type { StatusDotTone } from "../primitives/index.js";

export type ShellTheme = "light" | "dark";

// Espelha JobStatusSchema (queued|running|done|failed|cancelled) + "all". Sem "queued" e
// "cancelled" esses itens só existiam dentro de TODOS, sem forma de isolar.
export type HistoryStatusFilterUI = "all" | "queued" | "running" | "done" | "failed" | "cancelled";

export type HistoryPeriodFilterUI = "7d" | "30d" | "90d" | "all";

export type HistoryItemVisual =
  | { readonly kind: "ring"; readonly value: number }
  | { readonly kind: "dot"; readonly tone: StatusDotTone; readonly pulse?: boolean };

export type HistoryItemMetaTone = "neutral" | "accent" | "danger";

export interface HistoryItemData {
  readonly id: string;
  readonly topic: string;
  readonly unread: boolean;
  readonly active: boolean;
  readonly visual: HistoryItemVisual;
  readonly meta: string;
  readonly metaTone: HistoryItemMetaTone;
}

export interface HistoryGroupData {
  readonly label: string;
  readonly items: readonly HistoryItemData[];
}

export type RailEmptyReason = "never-generated" | "filtered";

// F5-4 · strict read-only subset of the /voice practice section (packages/ui/app/voice/
// PracticeSectionVM) — a display-ready line, no depth enum/edit affordance leaking in here.
export interface VoiceCompanionPractice {
  readonly subjectLabel: string;
  readonly subject: string;
  readonly depthLabel: string;
}

export type VoiceCompanionContent =
  | { readonly kind: "empty"; readonly onCalibrate: () => void }
  | { readonly kind: "locked"; readonly onCalibrate: () => void }
  | {
      readonly kind: "ready";
      readonly confidenceValue: number;
      readonly confidenceCaption: string;
      readonly headline: string;
      readonly meta: string;
      readonly proseCore: string;
      readonly descriptorChips: readonly string[];
      readonly practice?: VoiceCompanionPractice | null;
      // Present only while pendingRebuild.status === "failed" — the same retry the /voice banner
      // offers, mirrored here since the companion can mount during /generate before /voice is seen.
      readonly rebuildFailure?: { readonly text: string; readonly onRetry: () => void; readonly pending: boolean } | null;
      readonly onSeeProfile: () => void;
    };
