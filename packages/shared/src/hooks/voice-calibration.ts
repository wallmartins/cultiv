import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConfirmWizardReviewInput, SetWizardContextInput } from "@my-ai-orchestrator/contracts";
import { useRun } from "../runtime/useRun.js";
import { queryKeys } from "./query-keys.js";
import { withSdk } from "./with-sdk.js";

export function useCalibrationSession(sessionId: string) {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.calibrationSession(sessionId),
    queryFn: () => run(withSdk((sdk) => sdk.voiceCalibration.getSession({ sessionId }))),
    enabled: Boolean(sessionId)
  });
}

export function useCalibrationEntitlement() {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.calibrationEntitlement(),
    queryFn: () => run(withSdk((sdk) => sdk.voiceCalibration.getEntitlement()))
  });
}

export function useStartCalibration() {
  const run = useRun();
  return useMutation({
    mutationFn: () => run(withSdk((sdk) => sdk.voiceCalibration.startSession()))
  });
}

// F3 — setContext now derives a seed practice profile server-side (LLM in the loop), so a
// transient provider hiccup shouldn't surface as a hard failure straight away: retry twice,
// invisibly, before the caller ever sees isError. isPending stays true across these retries, so
// the container's loading state already covers the wait.
export function useSetContext(sessionId: string) {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetWizardContextInput) =>
      run(withSdk((sdk) => sdk.voiceCalibration.setContext({ sessionId, ...input }))),
    onSuccess: (session) => qc.setQueryData(queryKeys.calibrationSession(sessionId), session),
    retry: 2,
    retryDelay: 300
  });
}

export interface SubmitCalibrationAnswerInput {
  readonly stepId: string;
  readonly text: string;
}

export function useSubmitCalibrationAnswer(sessionId: string) {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitCalibrationAnswerInput) =>
      run(withSdk((sdk) => sdk.voiceCalibration.submitStep({ sessionId, ...input }))),
    onSuccess: (session) => qc.setQueryData(queryKeys.calibrationSession(sessionId), session)
  });
}

export function useSkipStep(sessionId: string) {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => run(withSdk((sdk) => sdk.voiceCalibration.skipStep({ sessionId, stepId }))),
    onSuccess: (session) => qc.setQueryData(queryKeys.calibrationSession(sessionId), session)
  });
}

export function useCompleteCalibration(sessionId: string) {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ConfirmWizardReviewInput = {}) =>
      run(withSdk((sdk) => sdk.voiceCalibration.completeReview({ sessionId, ...input }))),
    onSuccess: (session) => {
      qc.setQueryData(queryKeys.calibrationSession(sessionId), session);
      void qc.invalidateQueries({ queryKey: queryKeys.voiceProfile() });
      void qc.invalidateQueries({ queryKey: queryKeys.onboarding() });
    }
  });
}
