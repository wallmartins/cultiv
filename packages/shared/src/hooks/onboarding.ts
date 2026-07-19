import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRun } from "../runtime/useRun.js";
import { queryKeys } from "./query-keys.js";
import { withSdk } from "./with-sdk.js";

export function useOnboarding() {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.onboarding(),
    queryFn: () => run(withSdk((sdk) => sdk.onboarding.getStatus()))
  });
}

export function useCompleteOnboarding() {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => run(withSdk((sdk) => sdk.onboarding.complete())),
    onSuccess: (status) => {
      qc.setQueryData(queryKeys.onboarding(), status);
    }
  });
}
