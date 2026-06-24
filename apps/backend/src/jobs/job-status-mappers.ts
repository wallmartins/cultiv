import type {
  ExecutionVoiceMetadataView,
  JobStatusResponse,
  PipelineRequest
} from "@my-ai-orchestrator/contracts";
import { resolveExecutionPresentation } from "@my-ai-orchestrator/contracts";
import type { JobRecord } from "@my-ai-orchestrator/database";

export interface JobStatusRuntimeView {
  readonly userId?: string;
  readonly voice?: ExecutionVoiceMetadataView;
  readonly request?: PipelineRequest;
}

export function resolveContentType(request: PipelineRequest, unknownFallback?: string): string {
  if ("pipeline" in request) {
    return request.pipeline.name;
  }

  if (unknownFallback !== undefined) {
    return request.contentType ?? request.pipelineType ?? unknownFallback;
  }

  return request.contentType ?? request.pipelineType;
}

export function resolveEstimatedSteps(request: PipelineRequest, fallback = 1): number {
  if ("pipeline" in request) {
    return Math.max(request.pipeline.steps.length, 1);
  }

  return fallback;
}

export function toJobStatusResponse(record: JobRecord, runtime?: JobStatusRuntimeView): JobStatusResponse {
  const presentation = resolveExecutionPresentation(runtime?.request, record.contentType);

  return {
    jobId: record.id,
    status: record.status,
    contentType: record.contentType,
    progress: record.progress,
    result: record.result,
    error: record.error,
    createdAt: record.createdAt,
    completedAt: record.completedAt,
    voice: runtime?.voice,
    userId: runtime?.userId,
    ...presentation
  };
}
