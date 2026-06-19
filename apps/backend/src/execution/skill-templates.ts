import { describeOutputWordTarget, resolveOutputWordTargetForFormatName } from "@my-ai-orchestrator/text-quality";

export interface IntentWordTarget {
  readonly min: number;
  readonly max: number;
}

export function isIntentWordTarget(value: unknown): value is IntentWordTarget {
  return (
    typeof value === "object"
    && value !== null
    && typeof (value as IntentWordTarget).min === "number"
    && typeof (value as IntentWordTarget).max === "number"
  );
}

export function resolveContextWordTarget(
  inputs: Readonly<Record<string, unknown>>
): IntentWordTarget | undefined {
  if (isIntentWordTarget(inputs.wordTarget)) {
    return inputs.wordTarget;
  }

  const nestedContext = inputs.context;
  if (
    typeof nestedContext === "object"
    && nestedContext !== null
    && isIntentWordTarget((nestedContext as Record<string, unknown>).wordTarget)
  ) {
    return (nestedContext as { readonly wordTarget: IntentWordTarget }).wordTarget;
  }

  return undefined;
}

export function formatIntentWordTargetLine(wordTarget: IntentWordTarget): string {
  return `Target length: between ${wordTarget.min} and ${wordTarget.max} words.`;
}

export function classifyStep(stepName: string): "generate" | "transform" | "validate" | "enrich" {
  if (stepName === "refine" || stepName === "tighten" || stepName === "publish") {
    return "transform";
  }

  if (stepName === "analyze") {
    return "validate";
  }

  if (stepName === "outline" || stepName === "structure" || stepName === "expand") {
    return "enrich";
  }

  return "generate";
}

export interface StructuredStepTemplate {
  readonly system: string;
  readonly user: string;
}

function buildSystemTemplate(): string {
  return [
    "You are a writing assistant. Your sole job is to produce text that sounds like a specific human author. Follow every rule below exactly.",
    "",
    "== AUTHOR VOICE (mandatory) ==",
    "Tone: {{tone}}",
    "Cadence: {{cadence}}",
    "Language: {{languageName}} ({{languageCode}})",
    "",
    "Author description:",
    "{{voiceDescription}}",
    "",
    "Style markers you MUST apply:",
    "{{styleMarkers}}",
    "",
    "Writing rules you MUST obey:",
    "{{voiceRules}}",
    "",
    "Hard constraints:",
    "{{voiceConstraints}}",
    "",
    "Anti-patterns you MUST avoid (never use these styles):",
    "{{antiPatterns}}",
    "",
    "{{lexiconInstruction}}",
    "{{lexicon}}",
    "",
    "Voice examples (study these closely; match rhythm, sentence length, phrasing, and level of personal presence):",
    "{{voiceExamples}}",
    "",
    "{{authorReasoningSection}}",
    "{{authorDevelopmentSection}}",
    "== TOPIC, AUDIENCE, AND DOMAIN ==",
    "Generation domain: {{generationDomain}}",
    "{{domainPolicy}}",
    "The briefing defines topic, audience, and angle. Examples, comparisons, and metaphors must fit that context.",
    "When tone is personal, keep the author present in first person with specific lived detail, not a detached essay voice.",
    "",
    "== FORMAT ==",
    "{{formatInstructions}}",
    "",
    "== OUTPUT RULES ==",
    "{{outputRules}}",
    "",
    "== TASK ==",
    "{{retryInstruction}}",
    "",
    "CRITICAL:",
    "- Return ONLY the final text.",
    "- Do NOT echo this prompt, headers, labels, or instructions.",
    "- Do NOT write in a generic AI voice. The text must feel personal, specific, and unmistakably written by the author described above.",
    "- Prioritize the author's voice examples and style markers over generic polished prose.",
    "- If tone is personal, the narrator must stay present throughout, not only in the opening line.",
    "- Do not use em dashes (— or –); use commas or periods instead."
  ].join("\n");
}

export function resolveStepTemplate(stepName: string): string {
  const structured = resolveStructuredStepTemplate(stepName);
  return [structured.system, "---", structured.user].join("\n");
}

export function resolveStructuredStepTemplate(stepName: string): StructuredStepTemplate {
  const system = buildSystemTemplate();

  switch (stepName) {
    case "research":
      return {
        system,
        user: [
          "{{stepLabel}}",
          "Topic: {{topic}}",
          "Briefing: {{briefingText}}"
        ].join("\n")
      };
    case "outline":
    case "structure":
      return {
        system,
        user: [
          "{{stepLabel}}",
          "Topic: {{topic}}",
          "Key briefing: {{briefingText}}",
          "Previous material: {{sourceText}}"
        ].join("\n")
      };
    case "draft":
    case "expand":
      return {
        system,
        user: [
          "{{stepLabel}}",
          "Topic: {{topic}}",
          "Briefing: {{briefingText}}",
          "Drafting against: {{sourceText}}",
          "Write in the author's voice. Match the voice examples. Use metaphors only when they fit this topic and audience."
        ].join("\n")
      };
    case "refine":
      return {
        system,
        user: [
          "{{stepLabel}}",
          "Topic: {{topic}}",
          "Briefing: {{briefingText}}",
          "Previous content: {{sourceText}}",
          "Refinement focus: {{constraints}}",
          "Preserve the author's voice, rhythm, and personal presence. Vary vocabulary and do not repeat the opening verbatim. Remove generic AI phrasing and imagery that does not match the briefing."
        ].join("\n")
      };
    case "tighten":
      return {
        system,
        user: [
          "{{stepLabel}}",
          "Topic: {{topic}}",
          "Briefing: {{briefingText}}",
          "Previous content: {{sourceText}}",
          "Condense to the target length. Remove repeated words and lemmas. Preserve voice, structure, and the core argument."
        ].join("\n")
      };
    case "publish":
      return {
        system,
        user: [
          "{{stepLabel}}",
          "Topic: {{topic}}",
          "Briefing: {{briefingText}}",
          "Previous content: {{sourceText}}",
          "Refinement focus: {{constraints}}",
          "Preserve the author's voice, rhythm, and personal presence. Remove generic AI phrasing and imagery that does not match the briefing."
        ].join("\n")
      };
    case "analyze":
      return {
        system,
        user: [
          "{{stepLabel}}",
          "Topic: {{topic}}",
          "Analysis source: {{briefingText}}"
        ].join("\n")
      };
    case "hook":
      return {
        system,
        user: [
          "{{stepLabel}}",
          "Topic: {{topic}}",
          "Opening angle: {{briefingText}}"
        ].join("\n")
      };
    default:
      return {
        system,
        user: [
          "{{stepLabel}}",
          "Topic: {{topic}}",
          "Briefing: {{briefingText}}",
          "Previous content: {{sourceText}}"
        ].join("\n")
      };
  }
}

export function resolveFormatInstructions(
  contentType: string,
  stepName: string,
  contextWordTarget?: IntentWordTarget
): string {
  const target = resolveContentFormat(contentType);
  const wordTarget = (stepName === "draft" || stepName === "refine") && contextWordTarget
    ? formatIntentWordTargetLine(contextWordTarget)
    : `Target length: ${describeOutputWordTarget(resolveOutputWordTargetForFormatName(contentType))}.`;
  const stepContract = stepName === "hook"
    ? "Return only the opening hook, not the full piece."
    : stepName === "outline" || stepName === "structure" || stepName === "analyze"
      ? "Return only working material for the current step, while staying inside the target format."
      : stepName === "draft" || stepName === "expand"
        ? "Return a complete draft in the target format, not notes about the draft."
        : stepName === "tighten"
          ? "Return only the condensed final text in the target format."
          : "Return only the final revised text in the target format.";

  return `${target} ${wordTarget} ${stepContract}`.trim();
}

export function resolveOutputRules(stepName: string): string {
  const baseRules = [
    "Do not mention that you are drafting, refining, rewriting, editing, or providing a version",
    "Do not add framing phrases like 'here is', 'aqui está', 'segue', 'eu vejo assim'",
    "Do not describe the quality of the text or the process used to produce it",
    "Do not output markdown emphasis, code fences, bullet lists, or section headings unless the requested format explicitly requires them",
    "Return the content itself, not commentary about the content",
    "Prefer lived progression, observation, and consequence over rigid numbered validation of a thesis",
    "When mentioning benefits, consequences, or trade-offs, derive them from concrete situations in the text instead of listing them abstractly",
    "When using metaphors or analogies, they must fit the briefing topic and audience",
    "Do not use technical jargon, tool names, or software metaphors unless the generation domain is technical",
    "Do not use em dashes (— or –); use commas or periods instead",
    "When tone is personal, keep first-person presence and specific lived detail throughout the piece"
  ];

  if (stepName === "hook") {
    return [...baseRules, "Return a single hook only"].join("; ");
  }

  if (stepName === "outline" || stepName === "structure" || stepName === "analyze") {
    return [...baseRules, "Keep the output concise and directly usable by the next step"].join("; ");
  }

  if (stepName === "tighten") {
    return [...baseRules, "Do not add new ideas while condensing", "Remove repeated lemmas and echo from earlier steps"].join("; ");
  }

  if (stepName === "refine") {
    return [...baseRules, "Vary vocabulary and do not repeat the opening hook verbatim"].join("; ");
  }

  return baseRules.join("; ");
}

export function resolveRefinementMode(stepName: string): "critic" | "humanizer" | "refine" {
  if (stepName === "research" || stepName === "analyze") {
    return "critic";
  }

  if (stepName === "refine" || stepName === "tighten" || stepName === "publish") {
    return "refine";
  }

  return "humanizer";
}

function resolveContentFormat(contentType: string): string {
  if (contentType.includes("linkedin")) {
    return "Write as a concise LinkedIn feed post (not a long article): short paragraphs, one clear idea, natural rhythm, and no editor commentary.";
  }

  if (contentType.includes("thread") || contentType.includes("twitter")) {
    return "Write as a publishable short thread with tight, sequential flow and no editor commentary.";
  }

  if (contentType.includes("newsletter")) {
    return "Write as publishable newsletter copy with clear narrative flow and no editor commentary.";
  }

  if (contentType.includes("blog")) {
    return "Write as a publishable blog draft with coherent structure and no editor commentary.";
  }

  if (contentType.includes("post")) {
    return "Write as a publishable post for the requested audience and no editor commentary.";
  }

  return "Write as final publishable content for the requested format and no editor commentary.";
}

export function formatStepLabel(stepName: string): string {
  return stepName
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
