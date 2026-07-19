import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import type { EvalCase } from "../types.js";

export interface GeneratorAdapter {
  readonly name: string;
  readonly generate: (evalCase: EvalCase, voiceProfile: TextQualityVoiceProfile | undefined) => Promise<string>;
}
