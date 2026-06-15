import type { PipelineRequest, QualityMode } from "@my-ai-orchestrator/contracts";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";

const runtimeMetadataKeys = ["contentType", "language", "qualityMode"] as const;

export interface SanitizedSimplifiedGenerationInput {
  readonly kind: "simplified";
  readonly briefing: string | Record<string, unknown>;
  readonly importedContext?: string;
  readonly contentType?: string;
  readonly language?: string;
  readonly qualityMode?: QualityMode;
}

export interface SanitizedExplicitGenerationInput {
  readonly kind: "explicit";
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly importedContext?: string;
  readonly contentType?: string;
  readonly language?: string;
  readonly qualityMode?: QualityMode;
}

export type SanitizedGenerationInput =
  | SanitizedSimplifiedGenerationInput
  | SanitizedExplicitGenerationInput;

export function resolveSanitizedGenerationInput(
  request: PipelineRequest,
  plan: OrchestrationPlan
): SanitizedGenerationInput {
  const language = "language" in request && typeof request.language === "string"
    ? request.language
    : plan.request.language;
  const qualityMode = "qualityMode" in request && request.qualityMode
    ? request.qualityMode
    : plan.request.qualityMode;
  const contentType = plan.contentType.id;

  if ("pipeline" in request) {
    const normalizedInputs = { ...plan.request.input };
    const { importedContext, ...inputs } = normalizedInputs;
    return {
      kind: "explicit",
      inputs,
      ...(typeof importedContext === "string" ? { importedContext } : {}),
      ...(contentType ? { contentType } : {}),
      ...(language ? { language } : {}),
      ...(qualityMode ? { qualityMode } : {})
    };
  }

  const normalizedBriefing = Object.prototype.hasOwnProperty.call(plan.request.input, "briefing")
    ? plan.request.input.briefing
    : plan.request.input;
  const normalizedImportedContext = typeof plan.request.input.importedContext === "string"
    ? plan.request.input.importedContext
    : undefined;

  return {
    kind: "simplified",
    briefing: normalizedBriefing as string | Record<string, unknown>,
    ...(normalizedImportedContext !== undefined ? { importedContext: normalizedImportedContext } : {}),
    ...(contentType ? { contentType } : {}),
    ...(language ? { language } : {}),
    ...(qualityMode ? { qualityMode } : {})
  };
}

export function toRuntimeInputRecord(
  input: SanitizedGenerationInput
): Record<string, unknown> {
  const metadata = {
    ...(input.contentType ? { contentType: input.contentType } : {}),
    ...(input.language ? { language: input.language } : {}),
    ...(input.qualityMode ? { qualityMode: input.qualityMode } : {})
  };

  if (input.kind === "explicit") {
    return {
      ...input.inputs,
      ...(input.importedContext !== undefined ? { importedContext: input.importedContext } : {}),
      ...metadata
    };
  }

  return {
    briefing: input.briefing,
    ...(input.importedContext !== undefined ? { importedContext: input.importedContext } : {}),
    ...metadata
  };
}

export function createRuntimeMetadataRequest(request: PipelineRequest): PipelineRequest {
  if ("pipeline" in request) {
    return {
      ...request,
      inputs: {},
      importedContext: undefined,
      context: undefined
    };
  }

  return {
    ...request,
    briefing: "",
    importedContext: undefined,
    context: undefined
  };
}

export function stripRuntimeMetadata(
  inputs: Readonly<Record<string, unknown>>
): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(inputs).filter(([key]) =>
      !runtimeMetadataKeys.includes(key as typeof runtimeMetadataKeys[number])
    )
  );
}
