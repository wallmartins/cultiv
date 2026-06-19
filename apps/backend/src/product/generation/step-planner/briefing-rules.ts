import type {
  GenerationIntent,
  GenerationLengthTier,
  PlannedStep
} from "@my-ai-orchestrator/contracts";
import type { StepPlannerPatchOp } from "./types.js";

export interface DerivePatchOpsInput {
  readonly briefing: string | Record<string, unknown>;
  readonly intent: GenerationIntent;
  readonly lengthTier: GenerationLengthTier;
}

const STRUCTURE_STEP: PlannedStep = {
  name: "structure",
  skill: "structure",
  execution: "llm",
  routingProfile: "premium-llm"
};

const SHORT_BRIEFING_CHAR_LIMIT = 200;
const LONG_SYSTEM_CONTEXT_CHAR_LIMIT = 400;

export function derivePatchOps(input: DerivePatchOpsInput): StepPlannerPatchOp[] {
  const ops: StepPlannerPatchOp[] = [];

  if (input.intent === "explain-deeply" && isShortBriefing(input.briefing)) {
    ops.push({ type: "removeStep", name: "research" }, { type: "removeStep", name: "outline" });
  }

  if (input.intent === "engage-audience" && !hasBriefingQuestion(input.briefing)) {
    ops.push({ type: "removeStep", name: "hook" });
  }

  if (input.intent === "document-decision" && hasLongSystemContext(input.briefing)) {
    ops.push({
      type: "insertStep",
      before: "draft",
      step: STRUCTURE_STEP
    });
  }

  return ops;
}

function isShortBriefing(briefing: string | Record<string, unknown>): boolean {
  return measureBriefingText(briefing) < SHORT_BRIEFING_CHAR_LIMIT;
}

function measureBriefingText(briefing: string | Record<string, unknown>): number {
  if (typeof briefing === "string") {
    return briefing.length;
  }

  return Object.values(briefing).reduce((total, value) => total + stringifyBriefingValue(value).length, 0);
}

function stringifyBriefingValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => stringifyBriefingValue(entry)).join("");
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((entry) => stringifyBriefingValue(entry))
      .join("");
  }

  return "";
}

function hasBriefingQuestion(briefing: string | Record<string, unknown>): boolean {
  if (typeof briefing === "string") {
    return false;
  }

  const question = briefing.question;
  return typeof question === "string" && question.trim().length > 0;
}

function hasLongSystemContext(briefing: string | Record<string, unknown>): boolean {
  if (typeof briefing === "string") {
    return false;
  }

  const systemContext = briefing.systemContext;
  return typeof systemContext === "string" && systemContext.length > LONG_SYSTEM_CONTEXT_CHAR_LIMIT;
}
