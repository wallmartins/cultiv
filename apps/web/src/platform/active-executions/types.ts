import type { JobError, JobProgress, JobResult, QualityMode } from "@my-ai-orchestrator/contracts";

export type ActiveExecutionStatus = "queued" | "running" | "done" | "failed";

export type ActiveExecutionItem = {
  readonly id: string;
  readonly contentType: string;
  readonly contentTypeLabel: string;
  readonly status: ActiveExecutionStatus;
  readonly progress: JobProgress | null;
  readonly result: JobResult | null;
  readonly error: JobError | null;
  readonly createdAt: string;
  readonly briefing?: Record<string, unknown>;
  readonly language?: string;
  readonly qualityMode?: QualityMode;
};

export const MAX_ACTIVE_EXECUTIONS = 20;
