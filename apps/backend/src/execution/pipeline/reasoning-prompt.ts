import type { CoreReasoningSignature, FormatExpressionProfile } from "@my-ai-orchestrator/contracts";

const STRUCTURAL_STEPS = new Set([
  "hook",
  "outline",
  "structure",
  "research",
  "draft",
  "expand"
]);
const REFINEMENT_STEPS = new Set(["refine", "tighten"]);

export function formatAuthorReasoningSection(
  stepName: string,
  core?: CoreReasoningSignature,
  formatExpression?: FormatExpressionProfile
): string {
  if (!core) {
    return "";
  }

  return ["== AUTHOR REASONING ==", formatAuthorReasoningBlock(stepName, core, formatExpression), ""].join("\n");
}

export function formatAuthorReasoningBlock(
  stepName: string,
  core?: CoreReasoningSignature,
  formatExpression?: FormatExpressionProfile
): string {
  if (!core) {
    return "";
  }

  if (REFINEMENT_STEPS.has(stepName)) {
    return [
      "Reasoning guardrails:",
      `- Certainty level: ${core.certaintyLevel}`,
      `- Judgment frequency: ${core.judgmentFrequency}`,
      `- Conclusion pace: ${core.conclusionPace}`,
      `- Reader relationship: ${core.readerRelationship}`,
      `- Authority source: ${core.authoritySource}`,
      "",
      "Derived anti-patterns to avoid:",
      ...formatBulletList(core.derivedAntiPatterns)
    ].join("\n");
  }

  if (!STRUCTURAL_STEPS.has(stepName)) {
    return [
      core.narrativeProse,
      "",
      `Certainty: ${core.certaintyLevel}; Judgment: ${core.judgmentFrequency}; Conclusion pace: ${core.conclusionPace}`,
      "",
      "Derived anti-patterns:",
      ...formatBulletList(core.derivedAntiPatterns)
    ].join("\n");
  }

  const formatLines = formatExpression
    ? [
        "",
        "Format expression:",
        formatExpression.narrativeProse,
        `- Register: ${formatExpression.register}`,
        `- Opening style: ${formatExpression.openingStyle}`,
        `- Technical density: ${formatExpression.technicalDensity}`
      ]
    : [];

  return [
    core.narrativeProse,
    "",
    `Certainty: ${core.certaintyLevel}`,
    `Judgment frequency: ${core.judgmentFrequency}`,
    `Conclusion pace: ${core.conclusionPace}`,
    `Reader relationship: ${core.readerRelationship}`,
    `Authority source: ${core.authoritySource}`,
    ...formatLines,
    "",
    "Derived anti-patterns:",
    ...formatBulletList(core.derivedAntiPatterns)
  ].join("\n");
}

function formatBulletList(items: readonly string[]): string[] {
  if (items.length === 0) {
    return ["- (none specified)"];
  }

  return items.map((item) => `- ${item}`);
}
