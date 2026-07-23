import { Effect, Schema } from "effect";
import type { PracticeProfile } from "@my-ai-orchestrator/contracts";
import type { WizardStepId } from "@my-ai-orchestrator/domain";
import { PracticeProfileGenerationError } from "./practice-profile-errors.js";
import {
  buildSystemPromptScaffold,
  formatDeclaredAxes,
  runPracticeProfileGeneration,
  type PracticeProfileGenerationDeps,
  type PracticeProfileLocale
} from "./practice-profile-generation-core.js";

export interface CalibrationAnchor {
  readonly wizardStepId: WizardStepId;
  readonly wordTarget: number;
  readonly prompt: string;
}
export type CalibrationAnchorSet = readonly CalibrationAnchor[];

const GeneratedAnchorsSchema = Schema.Struct({
  anchors: Schema.Struct({
    microOpinion: Schema.String,
    reasoningReflection: Schema.String,
    argumentDevelopment: Schema.String,
    formatAdaptation: Schema.String
  })
});
type GeneratedAnchors = typeof GeneratedAnchorsSchema.Type;
const decodeGeneratedAnchors = Schema.decodeUnknown(GeneratedAnchorsSchema);

// The 4 calibration acts (norte gerador-spec.md G3 / 05): order, wizard step id, and word target are
// curated and invariant across every field — only `promptKey` links an act to its generated text.
const CALIBRATION_ACTS: readonly {
  readonly wizardStepId: WizardStepId;
  readonly wordTarget: number;
  readonly promptKey: keyof GeneratedAnchors["anchors"];
}[] = [
  { wizardStepId: "micro_opinion", wordTarget: 60, promptKey: "microOpinion" },
  { wizardStepId: "reasoning_reflection", wordTarget: 150, promptKey: "reasoningReflection" },
  { wizardStepId: "argument_development", wordTarget: 250, promptKey: "argumentDevelopment" },
  { wizardStepId: "format_adaptation", wordTarget: 180, promptKey: "formatAdaptation" }
];

function clicheProbe(generated: GeneratedAnchors): readonly string[] {
  return [
    generated.anchors.microOpinion,
    generated.anchors.reasoningReflection,
    generated.anchors.argumentDevelopment,
    generated.anchors.formatAdaptation
  ];
}

function assembleAnchors(generated: GeneratedAnchors): CalibrationAnchorSet {
  return CALIBRATION_ACTS.map((act) => ({
    wizardStepId: act.wizardStepId,
    wordTarget: act.wordTarget,
    prompt: generated.anchors[act.promptKey]
  }));
}

const CALIBRATION_ACT_GUIDE = [
  "== THE 4 CALIBRATION ACTS (fixed structure — write ONLY the anchored question text for each) ==",
  "1. Reação (~60 words) — anchor in fieldCliche + resistance: ask about a field consensus/practice that doesn't hold up.",
  "2. Reflexão (~150 words) — anchor in evidence: ask for a real decision that turned out wrong, told through this field's evidence norm (an incident, a number, a case).",
  "3. Desenvolvimento (~250 words) — anchor in resistance + stake: ask to walk through a risky decision end to end, including the honest case where NOT deciding that way was right.",
  "4. Tradução (~180 words) — anchor in readerAssumption: ask to explain a field-insider concept to an outsider, crossing exactly the gap this profile's readerAssumption names.",
  "Write each prompt as a direct question to the author, in second person. Do not restate the act name or word target — just the question text."
].join("\n");

const JSON_SCHEMA_BLOCK = [
  "Return JSON only, no markdown fences or commentary, matching:",
  "{",
  '  "anchors": {',
  '    "microOpinion": "string",',
  '    "reasoningReflection": "string",',
  '    "argumentDevelopment": "string",',
  '    "formatAdaptation": "string"',
  "  }",
  "}"
].join("\n");

function buildSystemPrompt(locale: PracticeProfileLocale): string {
  return buildSystemPromptScaffold({
    role: "You write the calibration-anchor prompts for an onboarding wizard. The 4 acts and their word targets are FIXED and never vary — you write ONLY the anchored question text for each, anchored in this author's Practice Profile below.",
    locale
  });
}

// G3 · calibration anchor (synchronous, onboarding). The LLM writes only the anchored prompt text for
// the 4 fixed acts, anchored in the seed profile's dimensions — never the acts/order/word targets.
export function generateCalibrationAnchors(args: {
  readonly profile: PracticeProfile;
  readonly locale: PracticeProfileLocale;
  readonly deps: PracticeProfileGenerationDeps;
}): Effect.Effect<CalibrationAnchorSet, PracticeProfileGenerationError> {
  return runPracticeProfileGeneration<GeneratedAnchors>(
    {
      purpose: "practice-profile-calibration-anchor",
      system: buildSystemPrompt(args.locale),
      buildUser: (retrySuffix) =>
        [
          formatDeclaredAxes(args.profile),
          "",
          "== THIS AUTHOR'S PRACTICE DIMENSIONS (anchor every prompt in these) ==",
          JSON.stringify(args.profile.dimensions, null, 2),
          "",
          CALIBRATION_ACT_GUIDE,
          "",
          JSON_SCHEMA_BLOCK,
          retrySuffix
        ].join("\n"),
      decode: decodeGeneratedAnchors,
      selectClicheProbe: clicheProbe,
      retryEscape:
        "If you cannot name one, anchor the question in the profile's own named terms — never invent practitioners or cases."
    },
    args.deps
  ).pipe(Effect.map(assembleAnchors));
}

// Degrade path (norte G3): field-agnostic wording for the same 4 fixed acts, never the tech backbone.
// The caller decides when to fall back (e.g. `.pipe(Effect.orElseSucceed(...))` in onboarding) — this
// function stays pure and synchronous so it's always available when providers are down.
const AGNOSTIC_ANCHOR_PROMPTS: Readonly<Record<PracticeProfileLocale, readonly [string, string, string, string]>> = {
  "pt-BR": [
    "Qual crença comum na sua área você acha que não se sustenta quando posta à prova?",
    "Conte sobre uma vez em que você mudou de ideia sobre algo importante no seu trabalho — o que te fez mudar?",
    "Descreva como você conduz, do início ao fim, uma decisão difícil e arriscada na sua área — incluindo onde ela costuma dar errado.",
    "Explique para alguém de fora da sua área algo que todo profissional do seu campo considera óbvio, e por que isso importa."
  ],
  "en-US": [
    "Which common belief in your field do you think doesn't hold up when tested?",
    "Tell me about a time you changed your mind about something important in your work — what made you change it?",
    "Describe how you handle a difficult, risky decision in your field from start to finish — including where it tends to go wrong.",
    "Explain to someone outside your field something every practitioner in it takes for granted, and why it matters."
  ]
};

export function agnosticCalibrationAnchors(locale: PracticeProfileLocale): CalibrationAnchorSet {
  const prompts = AGNOSTIC_ANCHOR_PROMPTS[locale];
  return CALIBRATION_ACTS.map((act, index) => ({
    wizardStepId: act.wizardStepId,
    wordTarget: act.wordTarget,
    prompt: prompts[index]
  }));
}
