import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NicheAskResponseInput, UpdateDeclaredAxesInput } from "@my-ai-orchestrator/contracts";
import { useRun } from "../runtime/useRun.js";
import { queryKeys } from "./query-keys.js";
import { withSdk } from "./with-sdk.js";

// F4-2 · declared axes only (generation audience-narrowing).
export function usePracticeProfile() {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.practiceProfile(),
    queryFn: () => run(withSdk((sdk) => sdk.practiceProfile.get()))
  });
}

// F5-1 · the /voice identity read. Locale-keyed so switching the UI language re-fetches the
// server-rendered niche-ask question in the new language.
export function usePracticeIdentity(locale?: string) {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.practiceIdentity(locale),
    queryFn: () => run(withSdk((sdk) => sdk.practiceProfile.getIdentity(locale ? { locale } : undefined)))
  });
}

// Both writes return the fresh identity, but declared axes also feed the narrowing read (F4-2), so
// invalidate both. The prefix key clears every locale variant of the identity query.
function invalidatePracticeAfterChange(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["practice-identity"] });
  void qc.invalidateQueries({ queryKey: queryKeys.practiceProfile() });
}

// F5-2(a) · edit declared axes in-place. `locale` drives the backend re-seed's output language —
// pass the author's UI language so a material edit doesn't regenerate the profile in the wrong one.
export function useUpdateDeclaredAxes(locale?: string) {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDeclaredAxesInput) =>
      run(withSdk((sdk) => sdk.practiceProfile.updateDeclaredAxes({ ...input, locale }))),
    onSuccess: () => invalidatePracticeAfterChange(qc)
  });
}

// F5-2(b)/F5-3 · answer or dismiss the niche-ask. `locale` drives the re-enrichment output language.
export function useRespondToNicheAsk(locale?: string) {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NicheAskResponseInput) =>
      run(withSdk((sdk) => sdk.practiceProfile.respondToNicheAsk({ ...input, locale }))),
    onSuccess: () => invalidatePracticeAfterChange(qc)
  });
}
