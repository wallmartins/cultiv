import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountDeleteRequest } from "@my-ai-orchestrator/contracts";
import { useRun } from "../runtime/useRun.js";
import { queryKeys } from "./query-keys.js";
import { withSdk } from "./with-sdk.js";

export function useExportAccount() {
  const run = useRun();
  return useMutation({
    mutationFn: () => run(withSdk((sdk) => sdk.account.requestExport()))
  });
}

export function useAccountExportJob(jobId: string, enabled = true) {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.accountExportJob(jobId),
    queryFn: () => run(withSdk((sdk) => sdk.account.getExportJob({ jobId }))),
    enabled: enabled && Boolean(jobId),
    retry: false
  });
}

// reset purges voice profile/consent, execution history and onboarding status but keeps the
// wallet (see apps/backend/src/product/account/account-purge-transaction.ts) — invalidate those,
// plus entitlement since it reflects onboarding/voice gating (mirrors invalidateAfterConsentChange).
function invalidateAfterReset(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.voiceConsent() });
  void qc.invalidateQueries({ queryKey: queryKeys.voiceProfile() });
  void qc.invalidateQueries({ queryKey: queryKeys.onboarding() });
  void qc.invalidateQueries({ queryKey: queryKeys.entitlement() });
  void qc.invalidateQueries({ queryKey: ["executions", "list"] });
}

export function useResetAccount() {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => run(withSdk((sdk) => sdk.account.reset())),
    onSuccess: () => invalidateAfterReset(qc)
  });
}

export function useDeleteAccount() {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: AccountDeleteRequest) => run(withSdk((sdk) => sdk.account.deleteAccount(request))),
    // account is gone — no cached query is valid anymore.
    onSuccess: () => qc.clear()
  });
}
