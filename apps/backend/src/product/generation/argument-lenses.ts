import type { PerspectiveShiftDensity, RhetoricalMode } from "@my-ai-orchestrator/contracts";
import type { VoiceProfile } from "@my-ai-orchestrator/text-quality";

export type ArgumentLens =
  | "psychological"
  | "financial"
  | "team"
  | "organizational"
  | "career"
  | "operational"
  | "temporal";

export interface ArgumentLensDefinition {
  readonly id: ArgumentLens;
  readonly label: string;
  readonly prompt: string;
}

export const ARGUMENT_LENS_POOL: readonly ArgumentLensDefinition[] = [
  {
    id: "psychological",
    label: "Psychological",
    prompt: "How people feel, decide, and respond under pressure."
  },
  {
    id: "financial",
    label: "Financial",
    prompt: "Costs, trade-offs, and resource allocation tied to the thesis."
  },
  {
    id: "team",
    label: "Team",
    prompt: "Collaboration, roles, and interpersonal dynamics in practice."
  },
  {
    id: "organizational",
    label: "Organizational",
    prompt: "Culture, governance, and how institutions absorb the idea."
  },
  {
    id: "career",
    label: "Career",
    prompt: "Individual growth, reputation, and professional consequences."
  },
  {
    id: "operational",
    label: "Operational",
    prompt: "Day-to-day execution, workflows, and what actually changes."
  },
  {
    id: "temporal",
    label: "Temporal",
    prompt: "How the thesis plays out over time, before and after adoption."
  }
] as const;

const LENS_BY_ID = Object.fromEntries(
  ARGUMENT_LENS_POOL.map((lens) => [lens.id, lens] as const)
) as Record<ArgumentLens, ArgumentLensDefinition>;

// C-6 (decision b): the F1 clean cut deleted INTENT_LENS_PRIORITY without the promised re-key — this
// is that re-key, a declarative table by RhetoricalMode with a safe default (modes without a line fall
// through to briefing keywords + DEFAULT_LENS_ORDER). expound/argue inherit their old intent rows;
// promote is re-derived from the mode's definition ("persuade com interesse material", norte
// genero-dimensoes.md): how people decide + the material interest itself.
const MODE_LENS_PRIORITY: Partial<Record<RhetoricalMode, readonly ArgumentLens[]>> = {
  expound: ["operational", "temporal"],
  argue: ["operational", "organizational"],
  promote: ["psychological", "financial"]
};

const BRIEFING_KEYWORD_LENS: ReadonlyArray<{ readonly pattern: RegExp; readonly lens: ArgumentLens }> = [
  { pattern: /\b(psycholog|emotion|feeling|mental|behavior|motivat)\w*/i, lens: "psychological" },
  { pattern: /\b(cost|budget|revenue|money|invest|roi|profit|financial)\w*/i, lens: "financial" },
  { pattern: /\b(team|colleague|coworker|collaborat|squad|peer)\w*/i, lens: "team" },
  { pattern: /\b(organiz|company|culture|leadership|policy|governance|structure)\w*/i, lens: "organizational" },
  { pattern: /\b(career|promotion|growth|resume|professional)\w*/i, lens: "career" },
  { pattern: /\b(process|workflow|operation|execution|implement|practical)\w*/i, lens: "operational" },
  { pattern: /\b(time|timeline|future|past|long-term|short-term|history|evolution|trend)\w*/i, lens: "temporal" }
];

const DEFAULT_LENS_ORDER: readonly ArgumentLens[] = [
  "operational",
  "psychological",
  "team",
  "organizational",
  "temporal",
  "career",
  "financial"
];

const PERSPECTIVE_SHIFT_MAX_LENSES: Record<PerspectiveShiftDensity, number> = {
  low: 1,
  moderate: 2,
  high: 3
};

const ARGUMENT_LENS_STEPS = new Set(["draft", "expand", "structure"]);

export interface SelectArgumentLensesInput {
  readonly rhetoricalMode?: RhetoricalMode;
  readonly briefing?: string;
  readonly perspectiveShiftDensity?: PerspectiveShiftDensity;
  readonly maxLenses?: number;
}

export function resolvePerspectiveShiftDensity(
  voiceProfile?: Partial<VoiceProfile>
): PerspectiveShiftDensity | undefined {
  const traitProfile = voiceProfile?.argumentDevelopmentSignature?.traitProfile;
  if (!traitProfile) {
    return undefined;
  }

  const fromTraits = traitProfile.traits.perspectiveShiftDensity;
  if (fromTraits) {
    return fromTraits;
  }

  const fromRecord = traitProfile.records.perspectiveShiftDensity?.value;
  if (fromRecord === "low" || fromRecord === "moderate" || fromRecord === "high") {
    return fromRecord;
  }

  return undefined;
}

export function resolveMaxLensesFromDensity(
  density?: PerspectiveShiftDensity,
  override?: number
): number {
  if (typeof override === "number" && override > 0) {
    return Math.min(override, ARGUMENT_LENS_POOL.length);
  }

  if (density) {
    return PERSPECTIVE_SHIFT_MAX_LENSES[density];
  }

  return PERSPECTIVE_SHIFT_MAX_LENSES.moderate;
}

export function selectArgumentLenses(input: SelectArgumentLensesInput): readonly ArgumentLens[] {
  const maxLenses = resolveMaxLensesFromDensity(input.perspectiveShiftDensity, input.maxLenses);
  const briefing = normalizeBriefing(input.briefing);
  const ordered: ArgumentLens[] = [];

  const pushUnique = (lens: ArgumentLens) => {
    if (!ordered.includes(lens)) {
      ordered.push(lens);
    }
  };

  for (const lens of (input.rhetoricalMode && MODE_LENS_PRIORITY[input.rhetoricalMode]) ?? []) {
    pushUnique(lens);
  }

  if (briefing) {
    for (const entry of BRIEFING_KEYWORD_LENS) {
      if (entry.pattern.test(briefing)) {
        pushUnique(entry.lens);
      }
    }
  }

  for (const lens of DEFAULT_LENS_ORDER) {
    pushUnique(lens);
  }

  return ordered.slice(0, maxLenses);
}

export function formatArgumentLensesPromptBlock(lenses: readonly ArgumentLens[]): string {
  if (lenses.length === 0) {
    return "";
  }

  const lines = lenses.map((lensId) => {
    const lens = LENS_BY_ID[lensId];
    return `- ${lens.label}: ${lens.prompt}`;
  });

  return [
    "== ARGUMENT LENSES ==",
    "Develop the same thesis through each lens below. Do not change the topic.",
    "Do not invent statistics, studies, or citations. Use reasoning and concrete situations only.",
    "",
    ...lines,
    ""
  ].join("\n");
}

export function buildArgumentLensesSection(input: {
  readonly stepName: string;
  readonly voiceProfile?: Partial<VoiceProfile>;
  readonly briefing?: string;
  readonly rhetoricalMode?: RhetoricalMode;
}): string {
  if (!ARGUMENT_LENS_STEPS.has(input.stepName)) {
    return "";
  }

  const density = resolvePerspectiveShiftDensity(input.voiceProfile);
  const lenses = selectArgumentLenses({
    rhetoricalMode: input.rhetoricalMode,
    briefing: input.briefing,
    perspectiveShiftDensity: density
  });

  return formatArgumentLensesPromptBlock(lenses);
}

function normalizeBriefing(briefing: string | undefined): string {
  if (!briefing) {
    return "";
  }

  return briefing.trim();
}

export function isArgumentLensStep(stepName: string): boolean {
  return ARGUMENT_LENS_STEPS.has(stepName);
}
