import { useEffect, useRef, useState } from "react";
import {
  hasVoiceProfile,
  useCompleteCalibration,
  useCalibrationSession,
  useEntitlement,
  useSetContext,
  useShellStore,
  useSkipStep,
  useStartCalibration,
  useSubmitCalibrationAnswer,
  useToastStore,
  useUiLanguage,
  useVoiceProfile
} from "@my-ai-orchestrator/shared";
import { CalibrationWizard, type ResultStepState, type WizardStepContent } from "@my-ai-orchestrator/ui/app/onboarding";
import { useMessages } from "@my-ai-orchestrator/ui/app/i18n";
import {
  buildProgress,
  buildVoicePreviewVM,
  CONTEXT_STEP_ID,
  describeCalibrationError,
  formatCalibrationTrialLine,
  helperCopyFor,
  isLowConfidence,
  isPastStep,
  REVIEW_STEP_ID,
  stepBefore,
  weakestWritingStep,
  wordTargetsFor,
  writingStepEyebrow
} from "./calibrate-view.js";

// Container for the recalibrate overlay (variant='light') — mounted unconditionally by
// WorkspaceShellContainer, opened/closed by the shell store's recalOpen flag (set by /voice's
// onRecalibrate). No "calibrar depois" (voice already exists), no localStorage session — closing
// mid-wizard just drops progress, reopening starts a fresh session. No bridge — closing IS the exit.
export function WizardOverlay() {
  const t = useMessages();
  const recalOpen = useShellStore((state) => state.recalOpen);
  const closeRecal = useShellStore((state) => state.closeRecal);
  const pushToast = useToastStore((state) => state.push);
  const uiLanguage = useUiLanguage((state) => state.language);

  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const startedRef = useRef(false);
  const startMutation = useStartCalibration();

  useEffect(() => {
    if (!recalOpen) {
      startedRef.current = false;
      setSessionId(undefined);
      return;
    }
    if (sessionId || startedRef.current) return;
    startedRef.current = true;
    startMutation.mutate(undefined, { onSuccess: (started) => setSessionId(started.sessionId) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recalOpen, sessionId]);

  const sessionQuery = useCalibrationSession(sessionId ?? "");
  const session = sessionQuery.data;
  const voiceProfileQuery = useVoiceProfile();
  const entitlementQuery = useEntitlement();

  const [displayStepId, setDisplayStepId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!recalOpen) {
      setDisplayStepId(undefined);
      return;
    }
    if (session && displayStepId === undefined) setDisplayStepId(session.currentStepId);
  }, [recalOpen, session, displayStepId]);

  const [subject, setSubject] = useState("");
  const [vantagePoint, setVantagePoint] = useState("");
  const [audiences, setAudiences] = useState<readonly string[]>([]);
  const [audienceDraft, setAudienceDraft] = useState("");
  const [writingDraft, setWritingDraft] = useState("");
  useEffect(() => {
    if (!displayStepId) return;
    const step = session?.steps.find((candidate) => candidate.stepId === displayStepId);
    setWritingDraft(step?.text ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayStepId]);

  const [resultState, setResultState] = useState<ResultStepState | undefined>();

  const setContextMutation = useSetContext(sessionId ?? "");
  const submitAnswerMutation = useSubmitCalibrationAnswer(sessionId ?? "");
  const skipStepMutation = useSkipStep(sessionId ?? "");
  const completeReviewMutation = useCompleteCalibration(sessionId ?? "");

  function handleContextContinue() {
    if (!sessionId) return;
    setContextMutation.mutate(
      { subject: subject.trim(), vantagePoint: vantagePoint.trim(), audiences, locale: uiLanguage },
      { onSuccess: (updated) => setDisplayStepId(updated.currentStepId) }
    );
  }

  function handleAudienceAdd() {
    const value = audienceDraft.trim();
    if (!value || audiences.includes(value)) return;
    setAudiences((current) => [...current, value]);
    setAudienceDraft("");
  }

  function handleAudienceRemove(value: string) {
    setAudiences((current) => current.filter((candidate) => candidate !== value));
  }

  function handleWritingContinue(stepId: string) {
    if (!sessionId) return;
    submitAnswerMutation.mutate(
      { stepId, text: writingDraft.trim() },
      {
        onSuccess: (updated) => setDisplayStepId(updated.currentStepId),
        onError: (error) =>
          pushToast({ id: "calibrate-submit-error", kind: "error", topic: t.onboarding.toast.submitError, message: describeCalibrationError(t, error) })
      }
    );
  }

  function handleWritingSkip(stepId: string) {
    if (!sessionId) return;
    skipStepMutation.mutate(stepId, {
      onSuccess: (updated) => setDisplayStepId(updated.currentStepId),
      onError: (error) =>
        pushToast({ id: "calibrate-skip-error", kind: "error", topic: t.onboarding.toast.skipError, message: describeCalibrationError(t, error) })
    });
  }

  async function handleCreateVoice() {
    // Recalibration only reaches here for an author who already has a voice — consent is already
    // granted, so the review action just rebuilds it.
    try {
      await completeReviewMutation.mutateAsync({});
    } catch (error) {
      setResultState({ kind: "error", message: describeCalibrationError(t, error), onRetry: handleCreateVoice });
    }
  }

  useEffect(() => {
    if (!recalOpen || resultState?.kind === "success" || !completeReviewMutation.isSuccess || !session) return;
    const profile = voiceProfileQuery.data;
    if (!profile || !hasVoiceProfile(profile)) return;

    const low = isLowConfidence(profile) ? weakestWritingStep(t, session) : undefined;
    setResultState({
      kind: "success",
      preview: buildVoicePreviewVM(profile, t),
      lowConfidence: low
        ? {
            weakStepLabel: low.label,
            onViewSample: () => {
              setDisplayStepId(low.stepId);
              setResultState(undefined);
            }
          }
        : undefined,
      trialLine: formatCalibrationTrialLine(t, entitlementQuery.data, new Date()),
      onContinue: closeRecal
    });
  }, [recalOpen, resultState, completeReviewMutation.isSuccess, voiceProfileQuery.data, session, entitlementQuery.data, closeRecal, t]);

  function buildWizardContent(stepId: string): WizardStepContent | undefined {
    if (!session) return undefined;

    if (stepId === CONTEXT_STEP_ID) {
      // Same floor as calibrate.tsx's full wizard: block + retry on setContext failure, no
      // "continue anyway" escape — reuses the review/result kinds' existing building/error states.
      if (setContextMutation.isError) {
        return {
          kind: "result",
          props: { state: { kind: "error", message: describeCalibrationError(t, setContextMutation.error), onRetry: handleContextContinue } }
        };
      }
      if (setContextMutation.isPending) {
        return { kind: "review", props: { state: { kind: "building" } } };
      }
      return {
        kind: "context",
        props: {
          subject,
          onSubjectChange: setSubject,
          vantagePoint,
          onVantagePointChange: setVantagePoint,
          audiences,
          audienceDraft,
          onAudienceDraftChange: setAudienceDraft,
          onAudienceAdd: handleAudienceAdd,
          onAudienceRemove: handleAudienceRemove,
          onContinue: handleContextContinue,
          pending: setContextMutation.isPending
        }
      };
    }

    if (stepId === REVIEW_STEP_ID) {
      const pending = completeReviewMutation.isPending;
      if (pending) return { kind: "review", props: { state: { kind: "building" } } };
      return {
        kind: "review",
        props: {
          state: {
            kind: "confirm",
            confirm: {
              onCreateVoice: handleCreateVoice,
              pending,
              trialLine: formatCalibrationTrialLine(t, entitlementQuery.data, new Date())
            }
          }
        }
      };
    }

    const step = session.steps.find((candidate) => candidate.stepId === stepId);
    const range = wordTargetsFor(stepId);
    // A step behind session.currentStepId is already submitted — the backend has no "reopen"
    // transition (GAP #12, docs/live/plan/fase-b-gaps.md), so it renders read-only and Continuar
    // just resumes at the real current step instead of re-submitting into a guaranteed 400.
    const pastStep = isPastStep(session, stepId);
    return {
      kind: "writing",
      props: {
        eyebrow: writingStepEyebrow(t, stepId),
        prompt: step?.prompt || t.onboarding.fallbackPrompt,
        helperCopy: helperCopyFor(t, stepId),
        value: writingDraft,
        onChange: setWritingDraft,
        minWords: range.min,
        targetWords: range.target,
        maxWords: range.max,
        onContinue: pastStep ? () => setDisplayStepId(session.currentStepId) : () => handleWritingContinue(stepId),
        onBack: () => {
          const previous = stepBefore(stepId);
          if (previous) setDisplayStepId(previous);
        },
        onSkip: pastStep ? undefined : () => handleWritingSkip(stepId),
        pending: submitAnswerMutation.isPending || skipStepMutation.isPending,
        readOnly: pastStep
      }
    };
  }

  if (!recalOpen) return null;
  if (resultState) {
    return <CalibrationWizard variant="light" progress={[]} content={{ kind: "result", props: { state: resultState } }} onClose={closeRecal} />;
  }
  if (!session || !displayStepId) {
    return <CalibrationWizard variant="light" progress={[]} content={{ kind: "review", props: { state: { kind: "building" } } }} onClose={closeRecal} />;
  }

  const content = buildWizardContent(displayStepId);
  if (!content) return null;

  return <CalibrationWizard variant="light" progress={buildProgress(t, session, displayStepId)} content={content} onClose={closeRecal} />;
}
