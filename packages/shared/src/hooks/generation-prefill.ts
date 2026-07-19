import { useMutation } from "@tanstack/react-query";
import type { GenerationPrefillRequest } from "@my-ai-orchestrator/contracts";
import { useRun } from "../runtime/useRun.js";
import { withSdk } from "./with-sdk.js";

export function useGeneratePrefill() {
  const run = useRun();
  return useMutation({
    mutationFn: (request: GenerationPrefillRequest) => run(withSdk((sdk) => sdk.generationPrefill.infer(request)))
  });
}
