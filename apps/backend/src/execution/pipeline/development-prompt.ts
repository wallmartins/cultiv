import type { ArgumentDevelopmentSignature, DevelopmentTraitProfile, TraitKey } from "@my-ai-orchestrator/contracts";

const STRUCTURAL_STEPS = new Set([
  "hook",
  "outline",
  "structure",
  "research",
  "draft",
  "expand"
]);
const REFINEMENT_STEPS = new Set(["refine", "tighten"]);

export function formatArgumentDevelopmentSection(
  stepName: string,
  development?: ArgumentDevelopmentSignature
): string {
  if (!development) {
    return "";
  }

  return [
    "== ARGUMENT DEVELOPMENT ==",
    formatArgumentDevelopmentBlock(stepName, development),
    ""
  ].join("\n");
}

export function formatArgumentDevelopmentBlock(
  stepName: string,
  development?: ArgumentDevelopmentSignature
): string {
  if (!development) {
    return "";
  }

  if (REFINEMENT_STEPS.has(stepName)) {
    return [
      "Development guardrails:",
      `- Epistemic posture: ${development.epistemicPosture}`,
      "",
      "Structural anti-patterns to avoid:",
      ...formatBulletList(development.structuralAntiPatterns)
    ].join("\n");
  }

  if (!STRUCTURAL_STEPS.has(stepName)) {
    return [
      development.developmentProse,
      "",
      `Epistemic posture: ${development.epistemicPosture}`,
      "",
      "Typical moves:",
      ...formatBulletList(development.moveLabels)
    ].join("\n");
  }

  const transitions =
    development.transitionTendencies.length > 0
      ? [
          "",
          "Transition tendencies:",
          ...development.transitionTendencies.map(
            (tendency) => `- ${tendency.from} → ${tendency.to} (${tendency.frequency})`
          )
        ]
      : [];

  const traitSummary = formatDevelopmentTraitSummaryLine(development.traitProfile);
  const traitLine = traitSummary ? ["", traitSummary] : [];

  return [
    development.developmentProse,
    "",
    `Epistemic posture: ${development.epistemicPosture}`,
    "",
    "Typical moves:",
    ...formatBulletList(development.moveLabels),
    ...transitions,
    "",
    "Structural anti-patterns:",
    ...formatBulletList(development.structuralAntiPatterns),
    ...traitLine
  ].join("\n");
}

export function formatDevelopmentTraitSummaryLine(
  traitProfile?: DevelopmentTraitProfile
): string | undefined {
  if (!traitProfile) {
    return undefined;
  }

  const parts: string[] = [];

  for (const traitKey of TRAIT_PROMPT_KEYS) {
    const record = traitProfile.records[traitKey];
    if (!record?.value) {
      continue;
    }

    if (record.status === "unknown" || record.status === "disputed") {
      continue;
    }

    if (record.confidence !== "high" && record.status !== "confirmed") {
      continue;
    }

    parts.push(`${traitKey}=${record.value}`);
  }

  if (parts.length === 0) {
    return undefined;
  }

  return `Development traits (confirmed): ${parts.join("; ")}`;
}

const TRAIT_PROMPT_KEYS = [
  "openingMode",
  "insightTiming",
  "closingMode",
  "perspectiveShiftDensity",
  "usesCounterexamples",
  "selfQuestioning",
  "usesAnalogies"
] as const satisfies readonly TraitKey[];

function formatBulletList(items: readonly string[]): string[] {
  if (items.length === 0) {
    return ["- (none specified)"];
  }

  return items.map((item) => `- ${item}`);
}
