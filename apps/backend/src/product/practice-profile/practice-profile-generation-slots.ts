import { Effect, Schema } from "effect";
import type { PracticeProfile } from "@my-ai-orchestrator/contracts";
import { PracticeProfileGenerationError } from "./practice-profile-errors.js";
import {
  PRACTICE_DIMENSIONS_GUIDE,
  buildSystemPromptScaffold,
  formatDeclaredAxes,
  runPracticeProfileGeneration,
  type PracticeProfileGenerationDeps,
  type PracticeProfileLocale
} from "./practice-profile-generation-core.js";

// G4 curated slots (norte gerador-spec.md §G4, backbone-curado.md ticket 06). Fixed order and keys —
// the LLM only phrases each slot's question, never decides which slots exist.
export type GenerationSlotKey = "payload" | "anchor" | "resistance" | "stake";

export interface GenerationSlot {
  readonly slot: GenerationSlotKey;
  readonly question: string;
}

export type GenerationSlotSet = readonly GenerationSlot[];

const SLOT_ORDER: readonly GenerationSlotKey[] = ["payload", "anchor", "resistance", "stake"];

const GeneratedSlotsSchema = Schema.Struct({
  slots: Schema.Struct({
    payload: Schema.String,
    anchor: Schema.String,
    resistance: Schema.String,
    stake: Schema.String
  })
});
type GeneratedSlots = typeof GeneratedSlotsSchema.Type;
const decodeGeneratedSlots = Schema.decodeUnknown(GeneratedSlotsSchema);

const JSON_SCHEMA_BLOCK = [
  "Return JSON only, no markdown fences or commentary, matching:",
  "{",
  '  "slots": {',
  '    "payload": "string",',
  '    "anchor": "string",',
  '    "resistance": "string",',
  '    "stake": "string"',
  "  }",
  "}"
].join("\n");

function clicheProbe(generated: GeneratedSlots): readonly string[] {
  return [generated.slots.payload, generated.slots.anchor, generated.slots.resistance, generated.slots.stake];
}

function buildSystemPrompt(locale: PracticeProfileLocale): string {
  return buildSystemPromptScaffold({
    role: "You write the 4 curated generation-slot QUESTIONS asked to an author before drafting — the questions themselves, not their answers.",
    locale
  });
}

// G4 · generation slots (synchronous, generation critical path). Takes the profile (enriched if any) +
// theme + narrowed audience; returns the 4 curated slots written from profile × theme × audience.
export function generateGenerationSlots(args: {
  readonly profile: PracticeProfile;
  readonly theme: string;
  readonly narrowedAudience: string;
  readonly locale: PracticeProfileLocale;
  readonly deps: PracticeProfileGenerationDeps;
}): Effect.Effect<GenerationSlotSet, PracticeProfileGenerationError> {
  return runPracticeProfileGeneration<GeneratedSlots>(
    {
      purpose: "practice-profile-generation-slots",
      system: buildSystemPrompt(args.locale),
      buildUser: (retrySuffix) =>
        [
          formatDeclaredAxes(args.profile),
          "",
          PRACTICE_DIMENSIONS_GUIDE,
          "",
          "== PROFILE DIMENSIONS (anchor every question here) ==",
          JSON.stringify(args.profile.dimensions, null, 2),
          "",
          `Theme: ${args.theme}`,
          `Narrowed audience for this generation: ${args.narrowedAudience}`,
          "",
          "Write exactly these 4 slot QUESTIONS — curated and fixed, never add, drop, or rename one:",
          "- payload — anchored in dimension 1 (point): what the reader should take away.",
          "- anchor — anchored in dimension 2 (evidence): what backs the claim in this field.",
          "- resistance — anchored in dimension 4 (resistance): the honest other side, in this field's shape.",
          "- stake — anchored in dimension 5 (stake): why the reader decides now.",
          "Specialize every question to THIS theme and THIS narrowed audience — never a phrasing reusable verbatim across themes.",
          "",
          JSON_SCHEMA_BLOCK,
          retrySuffix
        ].join("\n"),
      decode: decodeGeneratedSlots,
      selectClicheProbe: clicheProbe,
      retryEscape:
        "If you cannot name one, anchor the question in the profile's own named terms — never invent practitioners or cases."
    },
    args.deps
  ).pipe(Effect.map((generated) => assembleSlots(generated.slots)));
}

function assembleSlots(slots: GeneratedSlots["slots"]): GenerationSlotSet {
  return SLOT_ORDER.map((slot) => ({ slot, question: slots[slot] }));
}

// Degrade path (norte G4: "cai no backbone atual de 4 ângulos — a instância de tech"). This is the
// single source of the generic 4-angle backbone copy: the prefill (F4-3) delegates to
// backboneGenerationSlots for its own degrade rather than keeping a duplicate. Not auto-wired into
// generateGenerationSlots — callers apply it themselves.
const BACKBONE_COPY: Readonly<
  Record<PracticeProfileLocale, Readonly<Record<GenerationSlotKey, (theme: string) => string>>>
> = {
  "pt-BR": {
    payload: (theme) => `Qual é a tese ou hipótese central que você quer defender sobre "${theme}"?`,
    anchor: () => "Que experiência concreta sua seria o melhor exemplo aqui?",
    resistance: () => "Existe um contraponto, uma tensão ou uma objeção que vale a pena nomear?",
    stake: () => "Por que esse tema importa pra você agora?"
  },
  "en-US": {
    payload: (theme) => `What's the core thesis or hypothesis you want to make about "${theme}"?`,
    anchor: () => "What concrete experience of yours would be the strongest example here?",
    resistance: () => "Is there a counterpoint, tension, or objection worth naming?",
    stake: () => "Why does this matter to you right now?"
  }
};

export function backboneGenerationSlots(args: {
  readonly theme: string;
  readonly locale: PracticeProfileLocale;
}): GenerationSlotSet {
  const copy = BACKBONE_COPY[args.locale];
  return SLOT_ORDER.map((slot) => ({ slot, question: copy[slot](args.theme) }));
}
