import type { Effect } from "effect";
import type { ContextManagerService, TraceRecorderService, Pipeline } from "@my-ai-orchestrator/core";
import type { SkillRegistryService } from "@my-ai-orchestrator/skills";
import type { OrchestratorRunOptions, OrchestrationResult } from "./orchestration-service.js";
import * as OrchestrationErrors from "./orchestration-errors.js";
import { executeOrchestrationRuntime } from "./orchestration-runtime.js";

export { OrchestrationError } from "./orchestration-errors.js";

export type { OrchestrationStepStatus } from "./orchestrator-types.js";

export function runOrchestrationLoop(
  pipeline: Pipeline,
  inputs: Record<string, unknown>,
  options?: OrchestratorRunOptions
): Effect.Effect<
  OrchestrationResult,
  OrchestrationErrors.OrchestrationError,
  ContextManagerService | TraceRecorderService | SkillRegistryService
> {
  return executeOrchestrationRuntime({ pipeline, inputs, options });
}
