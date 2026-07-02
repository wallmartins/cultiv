import type { GenerationIntent } from "@my-ai-orchestrator/contracts";
import {
  formatIntentWordTargetLine,
  type IntentWordTarget
} from "../../../execution/skill-templates.js";

const GENERATION_INTENTS: readonly GenerationIntent[] = [
  "share-idea",
  "explain-deeply",
  "engage-audience",
  "tell-story",
  "update-subscribers",
  "document-decision"
];

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

const INTENT_ANGLE: Record<GenerationIntent, string> = {
  "share-idea": "Lead with the core insight and why it matters now.",
  "explain-deeply": "Teach the idea in layers; move from context to mechanism to implication.",
  "engage-audience": "Invite reaction with a concrete tension, question, or lived moment.",
  "tell-story": "Use narrative progression with scene, tension, and resolution.",
  "update-subscribers": "Frame what changed, why it matters to the reader, and what to do next.",
  "document-decision": "State the decision, trade-offs considered, and the reasoning behind the choice."
};

const EXPRESSION_INSTRUCTIONS = buildExpressionInstructionCatalog();

function buildExpressionInstructionCatalog(): Readonly<Record<string, string>> {
  const catalog: Record<string, string> = {};

  for (const intent of GENERATION_INTENTS) {
    catalog[`${intent}-default`] = `${INTENT_ANGLE[intent]} Write as final publishable content for the requested audience.`;
  }

  for (const [channel, format] of Object.entries(CHANNEL_FORMAT_BASE)) {
    for (const intent of GENERATION_INTENTS) {
      catalog[`${channel}-${intent}`] = `${format} ${INTENT_ANGLE[intent]}`;
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
