import { buildGenerationContext, type GenerationContext } from "@my-ai-orchestrator/text-quality";
import { getBriefingText, getTopic } from "../skill-inputs.js";

export function resolveGenerationRuntimeContext(input: {
  readonly contentType: string;
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly state?: Readonly<Record<string, unknown>>;
}): GenerationContext {
  const briefingText = getBriefingText(input.inputs);
  const topic = getTopic(input.inputs, input.state ?? {}, input.contentType);

  return buildGenerationContext({
    contentType: input.contentType,
    briefing: briefingText,
    topic
  });
}
