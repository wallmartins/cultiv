import type { PipelineRequest } from "@my-ai-orchestrator/contracts";

export interface BackendSkillOptions {
  readonly request: PipelineRequest;
  readonly adapter: string;
  readonly model: string;
  readonly qualityMode: "fast" | "balanced" | "strict";
}
