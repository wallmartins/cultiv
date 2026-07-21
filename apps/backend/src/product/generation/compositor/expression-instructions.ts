import { RHETORICAL_MODES, type RhetoricalMode } from "@my-ai-orchestrator/contracts";
import {
  formatIntentWordTargetLine,
  type IntentWordTarget
} from "../../../execution/skill-templates.js";

const CHANNEL_FORMAT_BASE: Record<string, string> = {
  email:
    "Write as a publishable email: include a compelling subject line, concise preview text, a scannable body, and one clear CTA.",
  professional:
    "Write for a professional network feed: hook-first opening, short paragraphs, one clear takeaway, and no editor commentary.",
  blog:
    "Write as a blog article: use descriptive headings, deepen each section with examples, and maintain narrative flow.",
  social:
    "Write for a social feed: punchy opening, tight paragraphs, conversational rhythm, and one core idea."
};

const MODE_ANGLE: Record<RhetoricalMode, string> = {
  expound: "Lead with the core insight and unfold it in layers: context, mechanism, implication.",
  narrate: "Use narrative progression with scene, tension, and resolution.",
  argue: "State the claim, weigh the trade-offs, and make the reasoning behind the position explicit.",
  instruct: "Guide the reader step by step; move from what, to why, to how.",
  promote: "Frame what changed, why it matters to the reader, and what to do next."
};

const EXPRESSION_INSTRUCTIONS = buildExpressionInstructionCatalog();

function buildExpressionInstructionCatalog(): Readonly<Record<string, string>> {
  const catalog: Record<string, string> = {};

  for (const mode of RHETORICAL_MODES) {
    catalog[`${mode}-default`] = `${MODE_ANGLE[mode]} Write as final publishable content for the requested audience.`;
  }

  for (const [channel, format] of Object.entries(CHANNEL_FORMAT_BASE)) {
    for (const mode of RHETORICAL_MODES) {
      catalog[`${channel}-${mode}`] = `${format} ${MODE_ANGLE[mode]}`;
    }
  }

  return catalog;
}

export function resolveExpressionFormatInstructions(
  expressionProfile: string,
  stepName: string,
  contextWordTarget?: IntentWordTarget
): string {
  const formatBase =
    EXPRESSION_INSTRUCTIONS[expressionProfile] ??
    EXPRESSION_INSTRUCTIONS[`${expressionProfile.split("-").at(-1)}-default`] ??
    "Write as final publishable content for the requested format and no editor commentary.";

  const wordTarget =
    (stepName === "draft" || stepName === "refine" || stepName === "expand" || stepName === "tighten")
    && contextWordTarget
      ? formatIntentWordTargetLine(contextWordTarget)
      : "";

  const stepContract =
    stepName === "hook"
      ? "Return only the opening hook, not the full piece."
      : stepName === "outline" || stepName === "structure" || stepName === "analyze"
        ? "Return only working material for the current step, while staying inside the target format."
        : stepName === "draft" || stepName === "expand"
          ? "Return a complete draft in the target format, not notes about the draft."
          : stepName === "tighten"
            ? "Return only the condensed final text in the target format."
            : "Return only the final revised text in the target format.";

  return [formatBase, wordTarget, stepContract].filter(Boolean).join(" ").trim();
}

export function listExpressionInstructionProfiles(): readonly string[] {
  return Object.keys(EXPRESSION_INSTRUCTIONS);
}
