import { create } from "zustand";
import type {
  GenerationChannel,
  GeneratePrefill,
  GenerationPrefillQuestion,
  GenreSignature
} from "@my-ai-orchestrator/contracts";

// ADR 0004 §4/§6 — theme-first wizard. Server is stateless (one prefill call, one execute
// call); the session between them lives here, client-side only, reset on generate/leave.
// "narrowing" (F4-2, ADR 0010 §6) sits between "analyzing" and the real "thread": the author's
// declared audiences are chip-narrowed to one before the prefill call, since the prefill's slot
// questions are written per narrowed audience.
export type WizardPhase = "hero" | "analyzing" | "narrowing" | "thread" | "firing";

export interface WizardAnswer {
  readonly questionId: string;
  readonly text: string;
  readonly skipped: boolean;
}

interface WizardSessionState {
  readonly phase: WizardPhase;
  readonly theme: string;
  readonly audience?: string;
  readonly channel?: GenerationChannel;
  readonly prefill?: GeneratePrefill;
  // F4-7 — inferred once, at the end of the questions; threaded into both preview and generate
  // so the price quote and the pipeline agree on the same rhetorical mode.
  readonly genre?: GenreSignature;
  readonly questionPlan: readonly GenerationPrefillQuestion[];
  readonly answers: readonly WizardAnswer[];
  readonly qIndex: number;
  readonly setTheme: (theme: string) => void;
  readonly beginNarrowing: () => void;
  readonly confirmAudience: (audience?: string) => void;
  readonly setPrefillResult: (input: {
    prefill: GeneratePrefill;
    questionPlan: readonly GenerationPrefillQuestion[];
  }) => void;
  readonly setChannel: (channel: GenerationChannel) => void;
  readonly setGenre: (genre: GenreSignature) => void;
  readonly submitAnswer: (questionId: string, text: string) => void;
  readonly skip: (questionId?: string) => void;
  readonly startFiring: () => void;
  readonly cancelFiring: () => void;
  readonly reset: () => void;
}

const INITIAL = {
  phase: "hero" as WizardPhase,
  theme: "",
  audience: undefined,
  channel: undefined,
  prefill: undefined,
  genre: undefined,
  questionPlan: [] as readonly GenerationPrefillQuestion[],
  answers: [] as readonly WizardAnswer[],
  qIndex: 0
};

export const useWizardSessionStore = create<WizardSessionState>((set, get) => ({
  ...INITIAL,
  setTheme: (theme) => set({ theme, phase: "analyzing" }),
  beginNarrowing: () => set({ phase: "narrowing" }),
  confirmAudience: (audience) => set({ audience, phase: "analyzing" }),
  setPrefillResult: ({ prefill, questionPlan }) => set({ prefill, questionPlan, phase: "thread", qIndex: 0 }),
  setChannel: (channel) => set({ channel }),
  setGenre: (genre) => set({ genre }),
  submitAnswer: (questionId, text) =>
    set((state) => ({
      answers: [...state.answers, { questionId, text, skipped: false }],
      qIndex: state.qIndex + 1
    })),
  // questionId is explicit for steps outside questionPlan (the channel synthetic step the
  // container appends — see apps/web/src/routes/generate-view.ts); falls back to the plan
  // lookup for a plain backbone/extra question.
  skip: (questionId) => {
    const id = questionId ?? get().questionPlan[get().qIndex]?.id;
    set((state) => ({
      answers: id ? [...state.answers, { questionId: id, text: "", skipped: true }] : state.answers,
      qIndex: state.qIndex + 1
    }));
  },
  startFiring: () => set({ phase: "firing" }),
  cancelFiring: () => set({ phase: "thread" }),
  reset: () => set(INITIAL)
}));
