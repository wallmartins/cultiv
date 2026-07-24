import { Effect, Schema } from "effect";
import type { PracticeProfile } from "@my-ai-orchestrator/contracts";
import { PracticeProfileGenerationError } from "./practice-profile-errors.js";
import {
  buildSystemPromptScaffold,
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
    role: "You write the 4 curated generation-slot questions asked to an author right before they draft a piece ABOUT A GIVEN THEME. These are ELICITATION questions that OPEN the theme — not the finished writing; the author's full voice is applied later, when the piece is drafted, so you do not need to sound like them here. The 4 slots are FIXED — you write ONLY the question text for each. Draw the SUBSTANCE and the WORDS of every question from THE THEME ITSELF. A rich theme pulls in more than one direction — an upside and a downside, a tension, several facets — so across the four questions OPEN the theme's different sides instead of funnelling all four onto one angle. Use the author's profile ONLY for tone and register: their usual subject, field vocabulary, pet metrics, and stock examples must NOT enter the questions. Never name a company, product, technology, framework, metric, event, person, or case the author must already recognize, and never presuppose the author's answer. Vary the phrasing so two different themes never share a question shape or a stock word. A question the author cannot answer off the top of their head about THIS theme has failed. Each is one short, direct sentence.",
    locale,
    specificityLine:
      "The average of a field IS that field's cliché — steer every question away from it, ESPECIALLY the author's own field clichés. Keep each question in the THEME'S own terms and let the author supply the specifics in their ANSWER — never name one yourself."
  });
}

// G4 · generation slots (synchronous, generation critical path). These are ELICITATION questions that
// open the theme — the author's full voice is applied later, at drafting — so the THEME drives every
// question's substance and words while the profile only colours tone/register. It deliberately does NOT
// inject the profile's dimension prose: that vivid vocabulary bank (p99, postmortem, code integrity)
// funnelled every theme into the author's pet field. Keeps the elicit-don't-presuppose contract of G3.
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
          "== THE THEME (the subject, and the source of every question's words) ==",
          args.theme,
          "",
          "A theme like this can cut more than one way at once — an upside and a downside, a tension, several facets. Across the four questions, open the theme's OWN different sides; never funnel all four onto one angle.",
          "",
          `Audience the finished piece addresses: ${args.narrowedAudience}`,
          "",
          "== THE AUTHOR'S VOICE (tone/register ONLY — never the subject; do not borrow its words, metrics, or examples) ==",
          `They usually write about: ${args.profile.subject}`,
          `Their vantage point: ${args.profile.vantagePoint}`,
          "The piece is about THE THEME above, not their usual subject — match their register, not their topic.",
          "",
          "Write exactly these 4 slot questions — curated and fixed, never add, drop, or rename one. Take each question's substance from the theme itself:",
          "- payload — ask what point or take the author wants the reader to leave with about this theme (let the theme decide whether that's a claim, a nuance, a warning, or a provocation — never force one).",
          "- anchor — ask what concrete experience of the author's OWN would ground their take on this theme, in their own words (never a metric, benchmark, or case you name).",
          "- resistance — ask for the honest other side or tension this theme raises (a theme that cuts both ways already hands you one — name it in the theme's terms).",
          "- stake — ask why this reader should care about this theme now.",
          "Word every question in the theme's own terms, keep each answerable off the top of the author's head, and vary the phrasing. Never funnel the theme into the author's usual field, vocabulary, or pet metrics.",
          "",
          JSON_SCHEMA_BLOCK,
          retrySuffix
        ].join("\n"),
      decode: decodeGeneratedSlots,
      selectClicheProbe: clicheProbe,
      // G4 writes eliciting QUESTIONS like G3: a question that names no case is correct — the specific
      // belongs in the author's ANSWER — so the `thin`/namesSpecific proxy must NOT gate it. Only the
      // dead-filler blocklist gates; the theme carries the substance, the profile only the register.
      allowThin: true,
      retrySuffix:
        "\n\nRETRY: A question read generic, used a dead cliché phrase, or funnelled the theme into the author's usual field or pet metrics. Rewrite it in the THEME'S own words, opening one of the theme's own sides — still one question the author can answer off the top of their head, still eliciting THEIR own take, never naming a company, technology, metric, or case they must already recognize."
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
