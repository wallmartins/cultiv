import type {
  GenerationLengthTier,
  PlannedStep,
  RhetoricalMode
} from "@my-ai-orchestrator/contracts";
import type { StepPlannerPatchOp } from "./types.js";

export interface DerivePatchOpsInput {
  readonly briefing: string | Record<string, unknown>;
  readonly rhetoricalMode: RhetoricalMode;
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

// Mode re-key of the old intent rules (F1-3): expound←explain-deeply (a layered exposition on a thin
// briefing skips research/outline), promote←engage-audience (a call-to-action without a posed question
// drops the hook), argue←document-decision (a claim over long context earns a structure pass). The two
// `question`/`systemContext` branches read briefing fields nothing populates yet — dead until defeitos/07.
export function derivePatchOps(input: DerivePatchOpsInput): StepPlannerPatchOp[] {
  const ops: StepPlannerPatchOp[] = [];

  if (input.rhetoricalMode === "expound" && isShortBriefing(input.briefing)) {
    ops.push({ type: "removeStep", name: "research" }, { type: "removeStep", name: "outline" });
  }

  if (input.rhetoricalMode === "promote" && !hasBriefingQuestion(input.briefing)) {
    ops.push({ type: "removeStep", name: "hook" });
  }

  if (input.rhetoricalMode === "argue" && hasLongSystemContext(input.briefing)) {
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

  return Object.values(briefing).reduce(
    (total: number, value) => total + stringifyBriefingValue(value).length,
    0
  );
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
