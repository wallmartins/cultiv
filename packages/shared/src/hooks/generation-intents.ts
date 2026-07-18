import { useQuery } from "@tanstack/react-query";
import { useRun } from "../runtime/useRun.js";
import { queryKeys } from "./query-keys.js";
import { withSdk } from "./with-sdk.js";

// Theme-first (ADR 0004) removed this from the primary generation flow — it stays around for
// internal derivation (e.g. humanizing a stored generationIntent into a label elsewhere).
export function useGenerationIntents() {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.generationIntents(),
    queryFn: () => run(withSdk((sdk) => sdk.generationIntents.list())),
    staleTime: Number.POSITIVE_INFINITY
  });
}
