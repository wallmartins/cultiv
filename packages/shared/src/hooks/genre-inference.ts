import { useMutation } from "@tanstack/react-query";
import type { GenreInferenceRequest } from "@my-ai-orchestrator/contracts";
import { useRun } from "../runtime/useRun.js";
import { withSdk } from "./with-sdk.js";

export function useGenreInference() {
  const run = useRun();
  return useMutation({
    mutationFn: (request: GenreInferenceRequest) => run(withSdk((sdk) => sdk.genreInference.infer(request)))
  });
}
