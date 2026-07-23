import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Effect } from "effect";
import type { TraitConfirmationInput } from "@my-ai-orchestrator/contracts";
import { useRun } from "../runtime/useRun.js";
import { queryKeys } from "./query-keys.js";
import { withSdk } from "./with-sdk.js";

// A 404 from GET /me/voice-profile means "hasn't calibrated yet" — expected before an author's first
// Voice Profile Rebuild, not a failure. It MUST be caught at the Effect level (here), not around
// runPromise: runPromise rejects with a FiberFailure that wraps the ClientSdkHttpStatusError, so a
// try/catch inspecting error._tag/.status never matches. `select` maps the null back to undefined so
// callers keep their `VoiceProfileScreenView | undefined` type.
export function useVoiceProfile() {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.voiceProfile(),
    queryFn: () =>
      run(
        withSdk((sdk) =>
          sdk.voice.getProfile().pipe(
            Effect.catchTag("ClientSdkHttpStatusError", (error) =>
              error.status === 404 ? Effect.succeed(null) : Effect.fail(error)
            )
          )
        )
      ),
    // While a rebuild is running (after calibration or a retry), poll so the screen advances from
    // in_progress to the finished prose — or back to the failed banner — without a manual refresh.
    refetchInterval: (query) => (query.state.data?.diagnostics.updating ? 2000 : false),
    select: (data) => data ?? undefined
  });
}

export function useConsentStatus() {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.voiceConsent(),
    queryFn: () => run(withSdk((sdk) => sdk.voice.getConsentStatus()))
  });
}

function invalidateAfterConsentChange(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.voiceConsent() });
  void qc.invalidateQueries({ queryKey: queryKeys.voiceProfile() });
  void qc.invalidateQueries({ queryKey: queryKeys.entitlement() });
}

export function useGrantConsent() {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => run(withSdk((sdk) => sdk.voice.grantConsent())),
    onSuccess: () => invalidateAfterConsentChange(qc)
  });
}

export function useRevokeConsent() {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => run(withSdk((sdk) => sdk.voice.revokeConsent())),
    onSuccess: () => invalidateAfterConsentChange(qc)
  });
}

export function useRecordTraitConfirmation() {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TraitConfirmationInput) => run(withSdk((sdk) => sdk.voice.recordTraitConfirmation(input))),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.voiceProfile() });
    }
  });
}

// Author-initiated retry after a failed extraction. Re-runs the rebuild (model fallback + repair);
// invalidating the profile query lets the polling above pick up in_progress → done.
export function useRequestRebuild() {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => run(withSdk((sdk) => sdk.voice.requestRebuild())),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.voiceProfile() });
    }
  });
}
