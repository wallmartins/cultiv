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

export type PracticeDepth = "seed" | "enriched";

export interface PracticeAxesVM {
  readonly subject: string;
  readonly vantagePoint: string;
  readonly audiences: readonly string[];
  readonly depth: PracticeDepth;
}

export interface PracticeNicheAskVM {
  readonly question: string;
}

export interface PracticeSectionVM {
  readonly axes: PracticeAxesVM;
  readonly nicheAsk: PracticeNicheAskVM | null;
  readonly edit: {
    readonly open: boolean;
    readonly subject: string;
    readonly vantagePoint: string;
    readonly audiences: readonly string[];
    readonly audienceDraft: string;
    readonly pending: boolean;
    readonly error?: string;
    readonly onOpen: () => void;
    readonly onCancel: () => void;
    readonly onSubjectChange: (value: string) => void;
    readonly onVantagePointChange: (value: string) => void;
    readonly onAudienceDraftChange: (value: string) => void;
    readonly onAudienceAdd: () => void;
    readonly onAudienceRemove: (value: string) => void;
    readonly onSave: () => void;
  };
  readonly nicheAskState: {
    readonly answerOpen: boolean;
    readonly answer: string;
    readonly pending: boolean;
    readonly onRespondOpen: () => void;
    readonly onAnswerChange: (value: string) => void;
    readonly onAnswerSubmit: () => void;
    readonly onDismiss: () => void;
  };
}
