import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import {
  describeOutputWordTarget,
  resolveOutputWordTargetForFormatName,
  type OutputWordTarget
} from "./word-targets.js";

export type { OutputWordTarget } from "./word-targets.js";
export { describeOutputWordTarget, resolveOutputWordTargetForFormatName } from "./word-targets.js";

interface FormatResolvableRequest {
  readonly contentType?: string;
  readonly pipelineType?: string;
  readonly pipeline?: {
    readonly name?: string;
  };
}

export function resolveOutputWordTarget(
  request: PipelineRequest | FormatResolvableRequest
): OutputWordTarget {
  return resolveOutputWordTargetForFormatName(resolveFormatName(request));
}

export function countWords(text: string): number {
  const normalized = text.trim();
  if (normalized.length === 0) {
    return 0;
  }

  return normalized.split(/\s+/u).length;
}

function resolveFormatName(
  request: PipelineRequest | FormatResolvableRequest
): string {
  if ("pipeline" in request && request.pipeline && typeof request.pipeline.name === "string") {
    return request.pipeline.name;
  }

  if ("contentType" in request && typeof request.contentType === "string") {
    return request.contentType;
  }

  if ("pipelineType" in request && typeof request.pipelineType === "string") {
    return request.pipelineType;
  }

  return "";
}
