export type GeneratePhase = "hero" | "analyzing" | "narrowing" | "thread" | "firing";

// Echoes the guided thread — one bubble per user answer, one block per system question. No
// import from contracts here (ui:Set([]) — this package is props-in, zero cross-package deps).
export type ThreadMessageData =
  | { readonly kind: "user"; readonly id: string; readonly text: string }
  | { readonly kind: "system"; readonly id: string; readonly prompt: string; readonly note?: string };

export interface ChannelOptionData {
  readonly id: string;
  readonly label: string;
  readonly active: boolean;
}
