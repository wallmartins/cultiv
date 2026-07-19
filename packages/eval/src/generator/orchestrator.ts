import { Effect, Layer } from "effect";
import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import {
  createContextManagerLayer,
  createTraceRecorderLayer
} from "@my-ai-orchestrator/core";
import { createSkillRegistryLayer } from "@my-ai-orchestrator/skills";
import { executeOrchestrationRuntime } from "@my-ai-orchestrator/orchestrator";
import type { EvalCase } from "../types.js";
import type { GeneratorAdapter } from "./types.js";
import { createEvalExecutionAdapter, type EvalExecutionAdapterOptions } from "./orchestrator-adapter.js";
import { buildPipeline, createEvalSkillRegistry, extractFinalText } from "./skills.js";

export { type EvalExecutionAdapterOptions };

export function createOrchestratorGenerator(options: EvalExecutionAdapterOptions = {}): GeneratorAdapter {
  return {
    name: "orchestrator",
    generate: async (evalCase: EvalCase, voiceProfile: TextQualityVoiceProfile | undefined) => {
      if (evalCase.suite !== "voice-fidelity") {
        return "";
      }

      const pipeline = buildPipeline(evalCase.input.contentType);
      const inputs: Record<string, unknown> = {
        briefing: evalCase.input.briefing,
        qualityMode: evalCase.input.qualityMode,
        voiceProfile
      };

      const adapter = createEvalExecutionAdapter(options);
      const registry = createEvalSkillRegistry();

      const program = executeOrchestrationRuntime({
        pipeline,
        inputs,
        options: {
          adapter,
          continueOnError: false
        }
      });

      const result = await Effect.runPromise(
        program.pipe(
          Effect.provide(createContextManagerLayer({ pipeline, inputs })),
          Effect.provide(createTraceRecorderLayer(pipeline, inputs, adapter.name)),
          Effect.provide(createSkillRegistryLayer(registry))
        )
      );

      if (result.status === "failed") {
        const stepError = result.trace?.steps.find((s) => s.error)?.error;
        const cause = stepError?.cause;
        const causeMessage =
          cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "";
        const detail = stepError
          ? `${stepError.type}: ${stepError.message}${causeMessage ? ` — ${causeMessage}` : ""}`
          : "";
        throw new Error(
          `Orchestrator generation failed after ${result.completedSteps} steps${detail ? `: ${detail}` : ""}`
        );
      }

      return extractFinalText(result.output);
    }
  };
}
