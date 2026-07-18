import { useEffect, useRef, useState } from "react";
import {
  hasVoiceProfile,
  useCompleteCalibration,
  useCalibrationSession,
  useEntitlement,
  useGrantConsent,
  useSetContext,
  useShellStore,
  useSkipStep,
  useStartCalibration,
  useSubmitCalibrationAnswer,
  useToastStore,
  useVoiceProfile
} from "@my-ai-orchestrator/shared";
import { CalibrationWizard, type ResultStepState, type WizardStepContent } from "@my-ai-orchestrator/ui/app/onboarding";
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
  const recalOpen = useShellStore((state) => state.recalOpen);
  const closeRecal = useShellStore((state) => state.closeRecal);
  const pushToast = useToastStore((state) => state.push);

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

  const [domain, setDomain] = useState("");
  const [audience, setAudience] = useState("");
  const [strength, setStrength] = useState("");
  const [writingDraft, setWritingDraft] = useState("");
  useEffect(() => {
    if (!displayStepId) return;
    const step = session?.steps.find((candidate) => candidate.stepId === displayStepId);
    setWritingDraft(step?.text ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayStepId]);

  const [consentGranted, setConsentGranted] = useState(false);
  const [resultState, setResultState] = useState<ResultStepState | undefined>();

  const setContextMutation = useSetContext(sessionId ?? "");
  const submitAnswerMutation = useSubmitCalibrationAnswer(sessionId ?? "");
  const skipStepMutation = useSkipStep(sessionId ?? "");
  const grantConsentMutation = useGrantConsent();
  const completeReviewMutation = useCompleteCalibration(sessionId ?? "");

  function handleContextContinue() {
    if (!sessionId) return;
    setContextMutation.mutate(
      { domain: domain.trim(), audience: audience.trim(), selfDeclaredStrength: strength.trim() || undefined },
      { onSuccess: (updated) => setDisplayStepId(updated.currentStepId) }
    );
  }

  function handleWritingContinue(stepId: string) {
    if (!sessionId) return;
    submitAnswerMutation.mutate(
      { stepId, text: writingDraft.trim() },
      {
        onSuccess: (updated) => setDisplayStepId(updated.currentStepId),
        onError: (error) =>
          pushToast({ id: "calibrate-submit-error", kind: "error", topic: "não conseguimos salvar essa amostra", message: describeCalibrationError(error) })
      }
    );
  }

  function handleWritingSkip(stepId: string) {
    if (!sessionId) return;
    skipStepMutation.mutate(stepId, {
      onSuccess: (updated) => setDisplayStepId(updated.currentStepId),
      onError: (error) =>
        pushToast({ id: "calibrate-skip-error", kind: "error", topic: "não conseguimos pular essa etapa", message: describeCalibrationError(error) })
    });
  }

  async function handleCreateVoice() {
    try {
      await grantConsentMutation.mutateAsync();
      await completeReviewMutation.mutateAsync({});
    } catch (error) {
      setResultState({ kind: "error", message: describeCalibrationError(error), onRetry: handleCreateVoice });
    }
  }

  useEffect(() => {
    if (!recalOpen || resultState?.kind === "success" || !completeReviewMutation.isSuccess || !session) return;
    const profile = voiceProfileQuery.data;
    if (!profile || !hasVoiceProfile(profile)) return;

    const low = isLowConfidence(profile) ? weakestWritingStep(session) : undefined;
    setResultState({
      kind: "success",
      preview: buildVoicePreviewVM(profile),
      lowConfidence: low
        ? {
            weakStepLabel: low.label,
            onRewrite: () => {
              setDisplayStepId(low.stepId);
              setResultState(undefined);
            }
          }
        : undefined,
      trialLine: formatCalibrationTrialLine(entitlementQuery.data, new Date()),
      onContinue: closeRecal
    });
  }, [recalOpen, resultState, completeReviewMutation.isSuccess, voiceProfileQuery.data, session, entitlementQuery.data, closeRecal]);

  function buildWizardContent(stepId: string): WizardStepContent | undefined {
    if (!session) return undefined;

    if (stepId === CONTEXT_STEP_ID) {
      return {
        kind: "context",
        props: {
          domain,
          onDomainChange: setDomain,
          audience,
          onAudienceChange: setAudience,
          strength,
          onStrengthChange: setStrength,
          onContinue: handleContextContinue,
          pending: setContextMutation.isPending
        }
      };
    }

    if (stepId === REVIEW_STEP_ID) {
      const pending = grantConsentMutation.isPending || completeReviewMutation.isPending;
      if (pending) return { kind: "review", props: { state: { kind: "building" } } };
      return {
        kind: "review",
        props: {
          state: {
            kind: "consent",
            consent: {
              granted: consentGranted,
              onToggle: setConsentGranted,
              onCreateVoice: handleCreateVoice,
              pending,
              trialLine: formatCalibrationTrialLine(entitlementQuery.data, new Date())
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
        eyebrow: writingStepEyebrow(stepId),
        prompt: step?.prompt || "conte com as suas palavras",
        helperCopy: helperCopyFor(stepId),
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

  return <CalibrationWizard variant="light" progress={buildProgress(session, displayStepId)} content={content} onClose={closeRecal} />;
}
