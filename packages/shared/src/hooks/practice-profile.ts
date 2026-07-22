import { useQuery } from "@tanstack/react-query";
import { useRun } from "../runtime/useRun.js";
import { queryKeys } from "./query-keys.js";
import { withSdk } from "./with-sdk.js";

export function usePracticeProfile() {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.practiceProfile(),
    queryFn: () => run(withSdk((sdk) => sdk.practiceProfile.get()))
  });
}
