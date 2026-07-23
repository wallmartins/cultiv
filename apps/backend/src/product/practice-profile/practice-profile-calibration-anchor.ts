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
  "== THE 4 CALIBRATION ACTS (fixed structure — write ONLY the question text for each) ==",
  "The '~N words' on each act is how much the AUTHOR writes in REPLY — it is NEVER the length of the question you write.",
  "Every question is a single, direct, second-person question: ONE sentence, ONE thing asked. No stacked or multi-part questions, no chained 'and how/why do you…' follow-ups, no preamble or framing — just the question a person could answer off the top of their head. A short qualifying clause is fine; a second question is not.",
  "Use the dimensions below only to pick the field's AREA, register, and vocabulary — never to name a specific case, claim, company, or number inside the question. Point each question at a category the author owns ('a decision in your work', 'a received practice in your field') and let them fill in the concrete example from their own experience.",
  "1. Reação (author replies ~60 words) — use fieldCliche as your read of what this field over-repeats, then ask which received practice in the AUTHOR'S OWN area they think doesn't hold up — name the area, not the specific claim. Keep resistance implicit — do NOT also ask about it.",
  "2. Reflexão (author replies ~150 words) — use evidence as your read of what counts as proof here, then ask for one of the author's OWN decisions that turned out wrong and what they later saw — framed so any practitioner in the field answers from their own work, never presupposing a specific incident, number, or case.",
  // Act 3 keeps resistance + stake (unlike act 1, collapsed to one dim): here the two form ONE
  // walk-through question — the stake is what makes the decision risky — not the compound debate act 1
  // produced. The one-sentence rule above already blocks it from splitting. Deliberate, not an oversight.
  "3. Desenvolvimento (author replies ~250 words) — use resistance + stake to ask the author to walk through one of their OWN risky decisions end to end, including the honest case where the safer choice was right; the stake is what made it risky, not an external example.",
  "4. Tradução (author replies ~180 words) — use readerAssumption to ask the author to explain a concept insiders in their field take for granted to a specific kind of outsider, crossing exactly the gap this profile names — name the concept's DOMAIN, but let the author pick the concept.",
  "Do not restate the act name or the word count — just the question text."
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
    role: "You write the 4 calibration questions for an onboarding wizard. The acts and their word targets are FIXED and never vary — you write ONLY the question text for each, shaped by this author's Practice Profile below. Each question ELICITS the author's own specific; it never presupposes one. Shape it with the field's own area, register, and vocabulary so a marketer's question could never be a lawyer's — but the concrete case, name, or number is what the AUTHOR supplies in the answer, never what you name in the question. Never reference a company, product, technology, framework, event, person, or case study the author must already recognize, and never assert the author personally lived a specific incident. A question the author cannot answer off the top of their head has failed. Each is one short, direct sentence.",
    locale,
    specificityLine:
      "The average of a field IS that field's cliché — steer every question away from it. But the named specific belongs in the author's ANSWER: shape the question in the field's own terms and let the author supply the case, never name one they must already know."
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
      // A calibration question elicits the author's specific — it must NOT be gated on naming one
      // (that force is exactly what produced "why is rewriting in Rust a fallacy?"). Only the dead-
      // filler blocklist gates here; field-shaping is carried by the prompt + the dimensions context.
      allowThin: true,
      retrySuffix:
        "\n\nRETRY: A question read generic or used a dead cliché phrase. Rewrite it in the field's own area and vocabulary — still one question the author can answer off the top of their head, still eliciting THEIR own example, never naming a company, technology, or case they must already recognize."
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
