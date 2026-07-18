import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TraitConfirmationInput } from "@my-ai-orchestrator/contracts";
import { useRun } from "../runtime/useRun.js";
import { queryKeys } from "./query-keys.js";
import { withSdk } from "./with-sdk.js";

export function useVoiceProfile() {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.voiceProfile(),
    queryFn: () => run(withSdk((sdk) => sdk.voice.getProfile()))
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
