import { buildGenerationContext, type GenerationContext } from "@my-ai-orchestrator/text-quality";

export function resolveGenerationRuntimeContext(input: {
  readonly contentType: string;
}): GenerationContext {
  return buildGenerationContext({
    contentType: input.contentType
  });
}
