import { Effect } from "effect";
import type { GenerationPrefillResponse } from "@my-ai-orchestrator/contracts";
import type { PrefillInferenceInfraError } from "../../http/errors.js";

export interface BackendGenerationPrefillRequest {
  readonly userId: string;
  readonly theme: string;
  readonly language?: string;
  // F0-6 — the narrowed-audience socket; F4-3 consumes it to instantiate the 4 audience-aware
  // slots (carga·ancoragem·resistência·stake) in place of up-front intent classification.
  readonly audience?: string;
}

export interface BackendGenerationPrefillService {
  readonly infer: (
    args: BackendGenerationPrefillRequest
  ) => Effect.Effect<GenerationPrefillResponse, PrefillInferenceInfraError>;
}
