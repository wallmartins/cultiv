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
    role: "You write the 4 curated generation-slot questions asked to an author right before they draft a piece ABOUT A GIVEN THEME. The 4 slots are FIXED — you write ONLY the question text for each. Every question is ABOUT the theme and ELICITS the author's own take on it; it never presupposes one. Use the author's Practice Profile ONLY to shape each question's register, vocabulary, and what that slot means for this author (what counts as their evidence, their kind of stake) — never to replace the theme with the author's usual subject, and never to name a company, product, technology, framework, event, person, case, or number the author must already recognize. A question the author cannot answer off the top of their head about THIS theme has failed. Each is one short, direct sentence.",
    locale,
    specificityLine:
      "The average of a field IS that field's cliché — steer every question away from it. But the named specific belongs in the author's ANSWER: shape the question in the field's own terms, keep it ABOUT the theme, and let the author supply the case — never name one they must already know."
  });
}

// G4 · generation slots (synchronous, generation critical path). The THEME is the subject of every
// question; the profile (enriched if any) + narrowed audience only shape register and what each slot
// means for this author — they never replace the theme. Returns the 4 curated slots as eliciting
// questions (same elicit-don't-presuppose contract as G3, so an off-field theme is not dragged back
// onto the author's usual subject).
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
          "== THE THEME (the subject of all 4 questions — every question is ABOUT this) ==",
          args.theme,
          "",
          `Audience the finished piece addresses: ${args.narrowedAudience}`,
          "",
          formatDeclaredAxes(args.profile),
          "",
          PRACTICE_DIMENSIONS_GUIDE,
          "",
          "== THIS AUTHOR'S PRACTICE DIMENSIONS (use ONLY to shape each question's register and what the slot means for this author — never as the subject, never a named case to reuse) ==",
          JSON.stringify(args.profile.dimensions, null, 2),
          "",
          "Write exactly these 4 slot questions — curated and fixed, never add, drop, or rename one. Each asks the author about THE THEME above, in the shape the matching dimension gives it:",
          "- payload — shaped by dimension 1 (point): what the author wants the reader to take away about this theme.",
          "- anchor — shaped by dimension 2 (evidence): what, from the author's own work, could back their take on this theme — point at a category they own, never a case you name.",
          "- resistance — shaped by dimension 4 (resistance): the honest other side of this theme, in this field's shape.",
          "- stake — shaped by dimension 5 (stake): why this reader should care about this theme now.",
          "Keep every question ABOUT the theme and answerable off the top of the author's head — never swap the theme for the author's usual subject, never reuse a phrasing verbatim across themes, never name a case, company, or technology the author must already recognize.",
          "",
          JSON_SCHEMA_BLOCK,
          retrySuffix
        ].join("\n"),
      decode: decodeGeneratedSlots,
      selectClicheProbe: clicheProbe,
      // G4 writes eliciting QUESTIONS like G3: a question that names no case is correct — the specific
      // belongs in the author's ANSWER — so the `thin`/namesSpecific proxy must NOT gate it. That force
      // is exactly what dragged this author's tech backbone (p99, infra, e-commerce peaks) onto an
      // off-field theme. Only the dead-filler blocklist gates; the theme + dimensions carry the shaping.
      allowThin: true,
      retrySuffix:
        "\n\nRETRY: A question read generic, used a dead cliché phrase, or drifted off the theme onto the author's usual subject. Rewrite it ABOUT the theme, in the field's own vocabulary — still one question the author can answer off the top of their head, still eliciting THEIR own take, never naming a company, technology, or case they must already recognize."
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
