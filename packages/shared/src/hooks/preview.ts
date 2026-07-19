import { useQuery } from "@tanstack/react-query";
import type { GenerationPreviewRequest } from "@my-ai-orchestrator/contracts";
import { useRun } from "../runtime/useRun.js";
import { queryKeys } from "./query-keys.js";
import { withSdk } from "./with-sdk.js";

export function usePreview(input: GenerationPreviewRequest, enabled = true) {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.preview(input),
    queryFn: () => run(withSdk((sdk) => sdk.preview.get(input))),
    enabled: enabled && Boolean(input.briefing)
  });
}
