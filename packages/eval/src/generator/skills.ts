import { Effect } from "effect";
import type { Context, Pipeline, StructuredPrompt } from "@my-ai-orchestrator/core";
import type {
  SkillDefinition,
  SkillExecutionContext,
  SkillExecutionResult
} from "@my-ai-orchestrator/skills";
import { createSkillRegistry } from "@my-ai-orchestrator/skills";
import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import {
  buildAnalyzePrompt,
  buildDraftPrompt,
  buildFinalizePrompt,
  buildHookPrompt,
  buildOutlinePrompt,
  buildRefinePrompt,
  buildResearchPrompt,
  buildSanitizePrompt,
  buildStructurePrompt,
  buildTightenPrompt
} from "./prompts.js";

export function createEvalSkillRegistry(): ReturnType<typeof createSkillRegistry> {
  const registry = createSkillRegistry();

  for (const skill of evalSkills) {
    Effect.runSync(registry.register(skill));
  }

  return registry;
}

const evalSkills: readonly SkillDefinition[] = [
  createPromptSkill("research", (context) => buildResearchPrompt(buildPromptContext(context))),
  createPromptSkill("outline", (context) => buildOutlinePrompt(buildPromptContext(context))),
  createPromptSkill("analyze", (context) => buildAnalyzePrompt(buildPromptContext(context))),
  createPromptSkill("structure", (context) => buildStructurePrompt(buildPromptContext(context))),
  createPromptSkill("hook", (context) => buildHookPrompt(buildPromptContext(context))),
  createPromptSkill("draft", (context) => buildDraftPrompt(buildPromptContext(context))),
  createPromptSkill("expand", (context) => buildDraftPrompt(buildPromptContext(context))),
  createPromptSkill("refine", (context) => buildRefinePrompt(buildPromptContext(context))),
  createPromptSkill("tighten", (context) => buildTightenPrompt(buildPromptContext(context))),
  createPromptSkill("finalize", (context) => buildFinalizePrompt(buildPromptContext(context))),
  createPromptSkill("publish", (context) => buildFinalizePrompt(buildPromptContext(context))),
  createSanitizeSkill()
];

function createPromptSkill(
  name: string,
  buildPrompt: (context: SkillExecutionContext) => StructuredPrompt
): SkillDefinition {
  return {
    name,
    description: `Eval ${name} step: produces a structured prompt for the LLM execution adapter.`,
    contract: {
      type: "generate",
      output: {
        parser: "text",
        description: `Structured prompt for the ${name} step`
      }
    },
    execute: (context) =>
      Effect.succeed({
        output: buildPrompt(context),
        metadata: { step: name }
      } satisfies SkillExecutionResult)
  };
}

function createSanitizeSkill(): SkillDefinition {
  return {
    name: "sanitize",
    description: "Eval sanitize step: strips template echo and returns clean text.",
    contract: {
      type: "transform",
      output: {
        parser: "text",
        description: "Clean final text"
      }
    },
    execute: (context) => {
      const previousStep = context.pipeline.steps[context.stepIndex - 1];
      const rawContent = previousStep ? context.state[previousStep.name] : undefined;
      const prompt = buildSanitizePrompt({
        briefing: getBriefing(context),
        contentType: context.pipeline.name,
        qualityMode: "balanced",
        voiceProfile: getVoiceProfile(context),
        previousContent: typeof rawContent === "string" ? rawContent : undefined
      });

      return Effect.succeed({
        output: prompt,
        metadata: { step: "sanitize" }
      });
    }
  };
}

function buildPromptContext(context: SkillExecutionContext): {
  briefing: string;
  contentType: string;
  qualityMode: "fast" | "balanced" | "strict";
  voiceProfile: TextQualityVoiceProfile | undefined;
  previousContent?: string;
} {
  return {
    briefing: getBriefing(context),
    contentType: context.pipeline.name,
    qualityMode: getQualityMode(context),
    voiceProfile: getVoiceProfile(context),
    previousContent: getPreviousContent(context)
  };
}

function getBriefing(context: SkillExecutionContext): string {
  const briefing = context.inputs.briefing;
  return typeof briefing === "string" ? briefing : "";
}

function getQualityMode(context: SkillExecutionContext): "fast" | "balanced" | "strict" {
  const mode = context.inputs.qualityMode;
  if (mode === "fast" || mode === "balanced" || mode === "strict") {
    return mode;
  }
  return "balanced";
}

function getVoiceProfile(context: SkillExecutionContext): TextQualityVoiceProfile | undefined {
  const voiceProfile = context.inputs.voiceProfile;
  return voiceProfile && typeof voiceProfile === "object"
    ? (voiceProfile as TextQualityVoiceProfile)
    : undefined;
}

function getPreviousContent(context: SkillExecutionContext): string | undefined {
  const previousStep = context.pipeline.steps[context.stepIndex - 1];
  if (!previousStep) {
    return undefined;
  }

  const previousContent = context.state[previousStep.name];
  return typeof previousContent === "string" ? previousContent : undefined;
}

export function extractFinalText(output: unknown): string {
  if (typeof output === "string") {
    return output;
  }

  if (output && typeof output === "object" && "sanitize" in output) {
    const sanitized = (output as Record<string, unknown>).sanitize;
    return typeof sanitized === "string" ? sanitized : "";
  }

  const lastStep = Object.entries(output as Record<string, unknown>).pop();
  if (lastStep && typeof lastStep[1] === "string") {
    return lastStep[1];
  }

  return "";
}

export function buildPipeline(contentType: string): Pipeline {
  const pipelineType = resolvePipelineType(contentType);

  const pipelines: Record<string, Pipeline> = {
    "long-form-blog": {
      name: "long-form-blog",
      steps: [
        { name: "research", skill: "research" },
        { name: "outline", skill: "outline" },
        { name: "draft", skill: "draft" },
        { name: "refine", skill: "refine" },
        { name: "finalize", skill: "finalize" },
        { name: "sanitize", skill: "sanitize" }
      ],
      inputs: {}
    },
    "linkedin-post": {
      name: "linkedin-post",
      steps: [
        { name: "hook", skill: "hook" },
        { name: "draft", skill: "draft" },
        { name: "refine", skill: "refine" },
        { name: "sanitize", skill: "sanitize" }
      ],
      inputs: {}
    },
    "twitter-thread": {
      name: "twitter-thread",
      steps: [
        { name: "hook", skill: "hook" },
        { name: "expand", skill: "expand" },
        { name: "tighten", skill: "tighten" },
        { name: "sanitize", skill: "sanitize" }
      ],
      inputs: {}
    }
  };

  return pipelines[pipelineType] ?? pipelines["long-form-blog"];
}

function resolvePipelineType(contentType: string): string {
  if (contentType.includes("linkedin")) {
    return "linkedin-post";
  }

  if (contentType.includes("thread") || contentType.includes("twitter")) {
    return "twitter-thread";
  }

  return "long-form-blog";
}
