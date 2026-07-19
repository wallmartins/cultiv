// Presentational view-models for packages/ui/app/voice/** — no `shared`/`client-sdk`/enum leakage.
// Containers (apps/web/src/routes/voice-mappers.ts, shell/companion-view.ts) build these from the
// real VoiceProfileScreenView; traitKey below is carried only for the container's callback wiring
// and must never be rendered.

export type TraitBadgeTone = "accent" | "danger" | "neutral";

export interface TraitVM {
  readonly traitKey: string;
  readonly label: string;
  readonly desc: string;
  readonly confidenceValue: number;
  readonly badgeLabel: string;
  readonly badgeTone: TraitBadgeTone;
}

export interface CoverageItemVM {
  readonly label: string;
  readonly caption: string;
  readonly value: number;
}
