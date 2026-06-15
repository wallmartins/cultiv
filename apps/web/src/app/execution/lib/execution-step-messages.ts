import type { AppLocale } from "~/i18n/app/types";
import type { AppMessages } from "~/i18n/app/types";

export type ExecutionPipelineStepId = "queued" | "analyze" | "draft" | "refine" | "sanitize";

export interface ExecutionStepPresentation {
  readonly label: string;
  readonly summary: string;
}

function normalizeExecutionStepId(stepId: string): ExecutionPipelineStepId | undefined {
  const normalized = stepId.trim().toLowerCase();
  if (
    normalized === "queued" ||
    normalized === "analyze" ||
    normalized === "draft" ||
    normalized === "refine" ||
    normalized === "sanitize"
  ) {
    return normalized;
  }

  return undefined;
}

export function getExecutionStepPresentation(
  _locale: AppLocale,
  stepId: string,
  messages: AppMessages
): ExecutionStepPresentation {
  const normalized = normalizeExecutionStepId(stepId);
  if (normalized) {
    return messages.executionSteps[normalized];
  }

  return {
    label: stepId,
    summary: messages.executionSteps.fallback.summary
  };
}
