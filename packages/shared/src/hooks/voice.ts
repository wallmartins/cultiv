import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TraitConfirmationInput, VoiceProfileScreenView } from "@my-ai-orchestrator/contracts";
import { useRun } from "../runtime/useRun.js";
import { queryKeys } from "./query-keys.js";
import { withSdk } from "./with-sdk.js";

// A 404 means "hasn't calibrated yet" — the normal state before an author's first Voice Profile
// Rebuild, not a failure. `select` unwraps the cached `null` back to `undefined` so callers keep
// their existing `VoiceProfileScreenView | undefined` type (matches router.tsx's shell-gate fetch,
// same query key — both must resolve the same shape or whichever wins the cache race breaks the other).
function isVoiceProfileNotFound(error: unknown): boolean {
  return (
    typeof error === "object"
    && error !== null
    && (error as { _tag?: unknown })._tag === "ClientSdkHttpStatusError"
    && (error as { status?: unknown }).status === 404
  );
}

export function useVoiceProfile() {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.voiceProfile(),
    queryFn: async (): Promise<VoiceProfileScreenView | null> => {
      try {
        return await run(withSdk((sdk) => sdk.voice.getProfile()));
      } catch (error) {
        if (isVoiceProfileNotFound(error)) return null;
        throw error;
      }
    },
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
