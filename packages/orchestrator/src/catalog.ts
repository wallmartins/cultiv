import type {
  ContentTypeDefinition,
  ExplicitPipelineRequest,
  PipelineDefinition,
  PipelineStepDefinition,
  PipelineType,
  SimplifiedPipelineRequest
} from "@my-ai-orchestrator/contracts";
import type { OrchestrationCatalog } from "./orchestrator-types.js";

function createPipelineStep(name: string, skill: string, config?: Readonly<Record<string, unknown>>): PipelineStepDefinition {
  return config ? { name, skill, config } : { name, skill };
}

function createPipelineDefinition(name: string, steps: readonly PipelineStepDefinition[]): PipelineDefinition {
  return { name, steps: [...steps] };
}

function humanizeLabel(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function createFallbackContentType(id: string, pipeline: PipelineDefinition, language: string): ContentTypeDefinition {
  return {
    id,
    label: humanizeLabel(id),
    steps: pipeline.steps.map((step) => step.name),
    defaultLanguage: language,
    inputSchema: {}
  };
}

export function createFallbackPipelineType(
  request: ExplicitPipelineRequest | SimplifiedPipelineRequest
): PipelineType | null {
  return "pipelineType" in request ? request.pipelineType : null;
}

export function createDefaultOrchestrationCatalog(): OrchestrationCatalog {
  return {
    pipelines: {
      "long-form-blog": createPipelineDefinition("long-form-blog", [
        createPipelineStep("research", "research"),
        createPipelineStep("outline", "outline"),
        createPipelineStep("draft", "draft"),
        createPipelineStep("refine", "refine"),
        createPipelineStep("finalize", "publish"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      "validation-post": createPipelineDefinition("validation-post", [
        createPipelineStep("analyze", "analyze"),
        createPipelineStep("draft", "draft"),
        createPipelineStep("refine", "refine"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      "architecture-post": createPipelineDefinition("architecture-post", [
        createPipelineStep("analyze", "analyze"),
        createPipelineStep("structure", "structure"),
        createPipelineStep("draft", "draft"),
        createPipelineStep("refine", "refine"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      "linkedin-post": createPipelineDefinition("linkedin-post", [
        createPipelineStep("hook", "hook"),
        createPipelineStep("draft", "draft"),
        createPipelineStep("refine", "refine"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      "twitter-thread": createPipelineDefinition("twitter-thread", [
        createPipelineStep("hook", "hook"),
        createPipelineStep("expand", "draft"),
        createPipelineStep("tighten", "refine"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      newsletter: createPipelineDefinition("newsletter", [
        createPipelineStep("outline", "outline"),
        createPipelineStep("draft", "draft"),
        createPipelineStep("refine", "refine"),
        createPipelineStep("finalize", "publish"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      "short-piece": createPipelineDefinition("short-piece", [
        createPipelineStep("hook", "hook"),
        createPipelineStep("draft", "draft"),
        createPipelineStep("refine", "refine"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      "long-piece": createPipelineDefinition("long-piece", [
        createPipelineStep("research", "research"),
        createPipelineStep("outline", "outline"),
        createPipelineStep("draft", "draft"),
        createPipelineStep("refine", "refine"),
        createPipelineStep("finalize", "publish"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      "serial-piece": createPipelineDefinition("serial-piece", [
        createPipelineStep("analyze", "analyze"),
        createPipelineStep("draft", "draft"),
        createPipelineStep("tighten", "tighten"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      "edition-piece": createPipelineDefinition("edition-piece", [
        createPipelineStep("draft", "draft"),
        createPipelineStep("refine", "refine"),
        createPipelineStep("tighten", "tighten"),
        createPipelineStep("sanitize", "sanitize")
      ])
    },
    contentTypes: {
      "long-form-blog": {
        id: "long-form-blog",
        label: "Long Form Blog",
        steps: ["research", "outline", "draft", "refine", "finalize", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      "validation-post": {
        id: "validation-post",
        label: "Validation Post",
        steps: ["analyze", "draft", "refine", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      "architecture-post": {
        id: "architecture-post",
        label: "Architecture Post",
        steps: ["analyze", "structure", "draft", "refine", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      "linkedin-post": {
        id: "linkedin-post",
        label: "LinkedIn Post",
        steps: ["hook", "draft", "refine", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      "twitter-thread": {
        id: "twitter-thread",
        label: "Twitter Thread",
        steps: ["hook", "expand", "tighten", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      newsletter: {
        id: "newsletter",
        label: "Newsletter",
        steps: ["outline", "draft", "refine", "finalize", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      "short-piece": {
        id: "short-piece",
        label: "Short Piece",
        steps: ["hook", "draft", "refine", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      "long-piece": {
        id: "long-piece",
        label: "Long Piece",
        steps: ["research", "outline", "draft", "refine", "finalize", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      "serial-piece": {
        id: "serial-piece",
        label: "Serial Piece",
        steps: ["analyze", "draft", "tighten", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      "edition-piece": {
        id: "edition-piece",
        label: "Edition Piece",
        steps: ["draft", "refine", "tighten", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      }
    },
    defaultLanguageByPipeline: {
      "long-form-blog": "pt-BR",
      "validation-post": "pt-BR",
      "architecture-post": "pt-BR",
      "linkedin-post": "pt-BR",
      "twitter-thread": "pt-BR",
      newsletter: "pt-BR",
      "short-piece": "pt-BR",
      "long-piece": "pt-BR",
      "serial-piece": "pt-BR",
      "edition-piece": "pt-BR"
    },
    defaultQualityModeByPipeline: {
      "long-form-blog": "strict",
      "validation-post": "balanced",
      "architecture-post": "strict",
      "linkedin-post": "balanced",
      "twitter-thread": "fast",
      newsletter: "balanced",
      "short-piece": "balanced",
      "long-piece": "strict",
      "serial-piece": "fast",
      "edition-piece": "balanced"
    }
  };
}
