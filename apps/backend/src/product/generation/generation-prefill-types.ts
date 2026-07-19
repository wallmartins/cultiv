import { Effect } from "effect";
import type { GenerationPrefillResponse } from "@my-ai-orchestrator/contracts";
import type { PrefillInferenceInfraError } from "../../http/errors.js";

export interface BackendGenerationPrefillRequest {
  readonly userId: string;
  readonly theme: string;
  readonly language?: string;
}

export interface BackendGenerationPrefillService {
  readonly infer: (
    args: BackendGenerationPrefillRequest
  ) => Effect.Effect<GenerationPrefillResponse, PrefillInferenceInfraError>;
}
