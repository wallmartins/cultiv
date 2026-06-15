import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Effect } from "effect";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import { createBackendJobStoreService } from "../../apps/backend";

export function createSimplifiedRequest(
  pipelineType: "twitter-thread" | "linkedin-post" | "validation-post" | "long-form-blog" | "newsletter",
  briefing: string
): PipelineRequest {
  return {
    userId: "user-123",
    pipelineType,
    briefing
  };
}

export function createJobStoreHarness() {
  const service = Effect.runSync(createBackendJobStoreService());

  return {
    createQueuedJob(request: Parameters<typeof service.createQueuedJob>[0], options?: Parameters<typeof service.createQueuedJob>[1]) {
      return Effect.runSync(service.createQueuedJob(request, options));
    },
    getJobStatus(jobId: Parameters<typeof service.getJobStatus>[0]) {
      return Effect.runSync(service.getJobStatus(jobId));
    },
    updateJobProgress(
      jobId: Parameters<typeof service.updateJobProgress>[0],
      progress: Parameters<typeof service.updateJobProgress>[1],
      updatedAt?: Parameters<typeof service.updateJobProgress>[2]
    ) {
      return Effect.runSync(service.updateJobProgress(jobId, progress, updatedAt));
    },
    completeJob(
      jobId: Parameters<typeof service.completeJob>[0],
      result: Parameters<typeof service.completeJob>[1],
      completedAt?: Parameters<typeof service.completeJob>[2]
    ) {
      return Effect.runSync(service.completeJob(jobId, result, completedAt));
    },
    failJob(
      jobId: Parameters<typeof service.failJob>[0],
      error: Parameters<typeof service.failJob>[1],
      completedAt?: Parameters<typeof service.failJob>[2]
    ) {
      return Effect.runSync(service.failJob(jobId, error, completedAt));
    },
    listJobEvents(jobId: Parameters<typeof service.listJobEvents>[0]) {
      return Effect.runSync(service.listJobEvents(jobId));
    },
    subscribe(
      jobId: Parameters<typeof service.subscribe>[0],
      listener: Parameters<typeof service.subscribe>[1]
    ) {
      return Effect.runSync(service.subscribe(jobId, listener));
    }
  };
}

export function extractImports(content: string): string[] {
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
  const matches = [...content.matchAll(importRegex)];
  return matches.map((match) => match[1]);
}

export function getBackendFileContent(file: string): string {
  try {
    return readFileSync(join(process.cwd(), "apps/backend", file), "utf-8");
  } catch {
    return "";
  }
}
