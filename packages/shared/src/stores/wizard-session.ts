import { create } from "zustand";
import type {
  GenerationChannel,
  GeneratePrefill,
  GenerationPrefillQuestion
} from "@my-ai-orchestrator/contracts";

// ADR 0004 §4/§6 — theme-first wizard. Server is stateless (one prefill call, one execute
// call); the session between them lives here, client-side only, reset on generate/leave.
export type WizardPhase = "hero" | "analyzing" | "thread" | "firing";

export interface WizardAnswer {
  readonly questionId: string;
  readonly text: string;
  readonly skipped: boolean;
}

interface WizardSessionState {
  readonly phase: WizardPhase;
  readonly theme: string;
  readonly channel?: GenerationChannel;
  readonly prefill?: GeneratePrefill;
  readonly questionPlan: readonly GenerationPrefillQuestion[];
  readonly answers: readonly WizardAnswer[];
  readonly qIndex: number;
  readonly setTheme: (theme: string) => void;
  readonly setPrefillResult: (input: {
    prefill: GeneratePrefill;
    questionPlan: readonly GenerationPrefillQuestion[];
  }) => void;
  readonly setChannel: (channel: GenerationChannel) => void;
  readonly submitAnswer: (questionId: string, text: string) => void;
  readonly skip: (questionId?: string) => void;
  readonly startFiring: () => void;
  readonly cancelFiring: () => void;
  readonly reset: () => void;
}

const INITIAL = {
  phase: "hero" as WizardPhase,
  theme: "",
  channel: undefined,
  prefill: undefined,
  questionPlan: [] as readonly GenerationPrefillQuestion[],
  answers: [] as readonly WizardAnswer[],
  qIndex: 0
};

export const useWizardSessionStore = create<WizardSessionState>((set, get) => ({
  ...INITIAL,
  setTheme: (theme) => set({ theme, phase: "analyzing" }),
  setPrefillResult: ({ prefill, questionPlan }) => set({ prefill, questionPlan, phase: "thread", qIndex: 0 }),
  setChannel: (channel) => set({ channel }),
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
