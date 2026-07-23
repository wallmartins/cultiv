import { Effect, Schema } from "effect";
import {
  PracticeDimensionsSchema,
  type PracticeDimensionKey,
  type PracticeDimensions,
  type PracticeProfile
} from "@my-ai-orchestrator/contracts";
import { namesSpecific } from "./practice-profile-anti-patterns.js";
import { PracticeProfileGenerationError } from "./practice-profile-errors.js";
import {
  PRACTICE_DIMENSIONS_GUIDE,
  buildSystemPromptScaffold,
  formatDeclaredAxes,
  runPracticeProfileGeneration,
  type DeclaredPracticeAxes,
  type PracticeProfileGenerationDeps,
  type PracticeProfileLocale
} from "./practice-profile-generation-core.js";

// LLM output. `fieldSpecifics` is an elicitation scratchpad (norte G1 "especificidade paramétrica"):
// the model must name real practitioners/debates/cases BEFORE filling dimensions. Not persisted.
const GeneratedProfileSchema = Schema.Struct({
  fieldSpecifics: Schema.Array(Schema.String),
  dimensions: PracticeDimensionsSchema
});
type GeneratedProfile = typeof GeneratedProfileSchema.Type;
const decodeGeneratedProfile = Schema.decodeUnknown(GeneratedProfileSchema);

const JSON_SCHEMA_BLOCK = [
  "Return JSON only, no markdown fences or commentary, matching:",
  "{",
  '  "fieldSpecifics": ["string"],',
  '  "dimensions": {',
  '    "point": "string",',
  '    "evidence": "string",',
  '    "readerAssumption": "string",',
  '    "resistance": "string",',
  '    "stake": "string",',
  '    "fieldCliche": "string",',
  '    "lexicon": ["string"]',
  "  }",
  "}"
].join("\n");

// Every specificity-bearing dimension (norte law 3 / T2: no dimension returns generic) — excludes
// fieldCliche and lexicon (naming a cliché / listing terms is their job; findThinDimensions covers
// those two instead). The fieldSpecifics scratchpad is probed as one unit: short fragments may lack
// a detector-visible anchor individually while anchoring collectively.
function clicheProbe(generated: GeneratedProfile): readonly string[] {
  return [
    generated.dimensions.point,
    generated.dimensions.evidence,
    generated.dimensions.readerAssumption,
    generated.dimensions.resistance,
    generated.dimensions.stake,
    generated.fieldSpecifics.join("; ")
  ];
}

function buildSystemPrompt(locale: PracticeProfileLocale): string {
  return buildSystemPromptScaffold({
    role: "You derive an author's Practice Profile — the 7 field-specific dimensions behind what they write and for whom.",
    locale,
    languageNote: "lexicon holds real field terms (may keep their native form)."
  });
}

// G1 · seed tier (synchronous, calibration screen 1→2). Parametric-specificity elicitation: force the
// model to name concrete specifics of the field, then fill the dimensions from them. No external call.
export function generateSeedPracticeProfile(args: {
  readonly userId: string;
  readonly version: number;
  readonly axes: DeclaredPracticeAxes;
  readonly locale: PracticeProfileLocale;
  readonly deps: PracticeProfileGenerationDeps;
}): Effect.Effect<PracticeProfile, PracticeProfileGenerationError> {
  return runPracticeProfileGeneration<GeneratedProfile>(
    {
      purpose: "practice-profile-seed",
      system: buildSystemPrompt(args.locale),
      buildUser: (retrySuffix) =>
        [
          formatDeclaredAxes(args.axes),
          "",
          PRACTICE_DIMENSIONS_GUIDE,
          "",
          "STEP 1 — In fieldSpecifics, name concrete specifics of THIS field: real practitioners, live debates, evidence norms, named cases or numbers. If you cannot name any, the field is unknown to you — leave fieldSpecifics empty rather than invent.",
          "STEP 2 — Fill each dimension anchored in those specifics. A generic dimension is a failure, not a fill.",
          "",
          JSON_SCHEMA_BLOCK,
          retrySuffix
        ].join("\n"),
      decode: decodeGeneratedProfile,
      selectClicheProbe: clicheProbe,
      retryEscape:
        "If you cannot name one, you do not know the field — leave fieldSpecifics empty and keep the dimension plain instead of inventing."
    },
    args.deps
  ).pipe(
    Effect.map((generated) => assembleProfile({ ...args, depth: "seed", dimensions: generated.dimensions }))
  );
}

export interface PracticeProfileEnrichment {
  readonly profile: PracticeProfile;
  // Dimensions that came back thin (no named specific) — the G5 niche-ask trigger (norte G2 degrade).
  readonly thinDimensions: readonly PracticeDimensionKey[];
}

// G2 · enrichment tier (asynchronous, rebuild post-consent). Deepens the seed's dimensions with more
// named specifics; only-adds, never rewrites the declared axes (03/05). Runs with provider-native web
// grounding (FU-2, the norte's ceiling): the Gemini google_search tool anchors the deepening in real
// practitioners/debates/cases. The Gemini→Groq fallback runs ungrounded (Groq has no grounding
// surface); thin dimensions still surface for the G5 niche-ask either way.
export function enrichPracticeProfile(args: {
  readonly seedProfile: PracticeProfile;
  readonly locale: PracticeProfileLocale;
  readonly deps: PracticeProfileGenerationDeps;
  // F5-3 · the G5 niche-ask answer, when this enrichment pass is re-triggered from /voice — anchors the
  // thin dimensions in the author's own specifics, on top of (never instead of) the declared axes.
  readonly authorSpecifics?: string;
}): Effect.Effect<PracticeProfileEnrichment, PracticeProfileGenerationError> {
  const axes: DeclaredPracticeAxes = {
    subject: args.seedProfile.subject,
    vantagePoint: args.seedProfile.vantagePoint,
    audiences: args.seedProfile.audiences
  };

  return runPracticeProfileGeneration<GeneratedProfile>(
    {
      purpose: "practice-profile-enrichment",
      system: buildSystemPrompt(args.locale),
      buildUser: (retrySuffix) =>
        [
          formatDeclaredAxes(axes),
          "",
          PRACTICE_DIMENSIONS_GUIDE,
          "",
          "== CURRENT SEED DIMENSIONS (deepen — add named specifics, never dilute) ==",
          JSON.stringify(args.seedProfile.dimensions, null, 2),
          ...(args.authorSpecifics
            ? [
                "",
                "== AUTHOR-PROVIDED SPECIFICS (the author answered the niche-ask — anchor the thin dimensions in these; never override the declared axes) ==",
                args.authorSpecifics
              ]
            : []),
          "",
          "STEP 1 — In fieldSpecifics, name MORE concrete specifics than the seed: real practitioners, live debates, named cases, numbers. Do not fabricate — if you cannot deepen a dimension, keep the seed value.",
          "STEP 2 — Return every dimension deepened where you named a specific, unchanged where you could not.",
          "",
          JSON_SCHEMA_BLOCK,
          retrySuffix
        ].join("\n"),
      decode: decodeGeneratedProfile,
      selectClicheProbe: clicheProbe,
      retryEscape:
        "If you cannot name one, keep the seed value unchanged — a thin dimension becomes a question to the author (the G5 niche-ask), never an invention.",
      acceptThinAfterRetry: true,
      grounding: true
    },
    args.deps
  ).pipe(
    Effect.map((generated) => ({
      profile: assembleProfile({
        userId: args.seedProfile.userId,
        version: args.seedProfile.version,
        axes,
        depth: "enriched",
        dimensions: generated.dimensions
      }),
      thinDimensions: findThinDimensions(generated.dimensions)
    }))
  );
}

function assembleProfile(args: {
  readonly userId: string;
  readonly version: number;
  readonly axes: DeclaredPracticeAxes;
  readonly depth: PracticeProfile["depth"];
  readonly dimensions: PracticeDimensions;
}): PracticeProfile {
  return {
    userId: args.userId,
    version: args.version,
    depth: args.depth,
    subject: args.axes.subject,
    vantagePoint: args.axes.vantagePoint,
    audiences: args.axes.audiences,
    dimensions: args.dimensions
  };
}

function findThinDimensions(dimensions: PracticeDimensions): readonly PracticeDimensionKey[] {
  const thin: PracticeDimensionKey[] = [];
  const prose: readonly [PracticeDimensionKey, string][] = [
    ["point", dimensions.point],
    ["evidence", dimensions.evidence],
    ["readerAssumption", dimensions.readerAssumption],
    ["resistance", dimensions.resistance],
    ["stake", dimensions.stake],
    ["fieldCliche", dimensions.fieldCliche]
  ];

  for (const [key, value] of prose) {
    if (!namesSpecific(value)) {
      thin.push(key);
    }
  }

  if (dimensions.lexicon.length === 0) {
    thin.push("lexicon");
  }

  return thin;
}
