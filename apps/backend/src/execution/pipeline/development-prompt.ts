import type { ArgumentDevelopmentSignature } from "@my-ai-orchestrator/contracts";

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
    ...formatBulletList(development.structuralAntiPatterns)
  ].join("\n");
}

function formatBulletList(items: readonly string[]): string[] {
  if (items.length === 0) {
    return ["- (none specified)"];
  }

  return items.map((item) => `- ${item}`);
}
