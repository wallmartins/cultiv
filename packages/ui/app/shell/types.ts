import type { StatusDotTone } from "../primitives/index.js";

export type ShellTheme = "light" | "dark";

export type HistoryStatusFilterUI = "all" | "done" | "running" | "failed";

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
      readonly onSeeProfile: () => void;
    };
