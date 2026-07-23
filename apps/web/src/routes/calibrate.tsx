import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import {
  hasVoiceProfile,
  useCompleteCalibration,
  useCompleteOnboarding,
  useCalibrationSession,
  useEntitlement,
  useGrantConsent,
  useSetContext,
  useShellStore,
  useSkipStep,
  useStartCalibration,
  useSubmitCalibrationAnswer,
  useToastStore,
  useUiLanguage,
  useVoiceProfile
} from "@my-ai-orchestrator/shared";
import { Pill } from "@my-ai-orchestrator/ui/app/primitives";
import { CalibrationWizard, type ResultStepState, type WizardStepContent } from "@my-ai-orchestrator/ui/app/onboarding";
import { PostResetReturn } from "@my-ai-orchestrator/ui/app/states";
import { useMessages } from "@my-ai-orchestrator/ui/app/i18n";
import {
  buildProgress,
  buildVoicePreviewVM,
  clearPostResetContext,
  clearStoredSessionId,
  CONTEXT_STEP_ID,
  describeCalibrationError,
  formatCalibrationTrialLine,
  helperCopyFor,
  isLowConfidence,
  isPastStep,
  readPostResetContext,
  readStoredSessionId,
  REVIEW_STEP_ID,
  stepBefore,
  storeSessionId,
  weakestWritingStep,
  wordTargetsFor,
  writingStepEyebrow,
  type PostResetContext
} from "./calibrate-view.js";

function firstName(name: string | undefined, fallback: string): string {
  return name?.trim().split(/\s+/)[0] ?? fallback;
}

type Phase = "wizard" | "result" | "bridge";

// Container for /app/calibrate (route wired by router.tsx, out of scope here — beforeLoad is
// auth-only, no loader). No router loader available, so the session is created/resumed on mount
// instead of via ensureQueryData; localStorage carries the sessionId across reloads.
export function CalibrateContainer() {
  const t = useMessages();
  const navigate = useNavigate();
  const { auth } = useRouteContext({ from: "/calibrate" });
  const companionOpen = useShellStore((state) => state.companionOpen);
  const toggleCompanion = useShellStore((state) => state.toggleCompanion);
  const pushToast = useToastStore((state) => state.push);
  const uiLanguage = useUiLanguage((state) => state.language);

  // 1e — set by settings.tsx right before a reset; consumed once, here, at the gate the reset
  // redirects to.
  const [postReset, setPostReset] = useState<PostResetContext | undefined>(() => readPostResetContext());

  const [sessionId, setSessionId] = useState<string | undefined>(() => readStoredSessionId());
  const startedRef = useRef(false);
  const startMutation = useStartCalibration();

  useEffect(() => {
    if (sessionId || startedRef.current) return;
    startedRef.current = true;
    startMutation.mutate(undefined, {
      onSuccess: (started) => {
        storeSessionId(started.sessionId);
        setSessionId(started.sessionId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const sessionQuery = useCalibrationSession(sessionId ?? "");
  const session = sessionQuery.data;
  const voiceProfileQuery = useVoiceProfile();
  const entitlementQuery = useEntitlement();

  const [displayStepId, setDisplayStepId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (session && displayStepId === undefined) setDisplayStepId(session.currentStepId);
  }, [session, displayStepId]);

  const [subject, setSubject] = useState("");
  const [vantagePoint, setVantagePoint] = useState("");
  const [audiences, setAudiences] = useState<readonly string[]>([]);
  const [audienceDraft, setAudienceDraft] = useState("");
  const contextInitRef = useRef(false);
  useEffect(() => {
    if (!session?.context || contextInitRef.current) return;
    contextInitRef.current = true;
    setSubject(session.context.subject ?? "");
    setVantagePoint(session.context.vantagePoint ?? "");
    setAudiences(session.context.audiences ?? []);
  }, [session]);

  const [writingDraft, setWritingDraft] = useState("");
  useEffect(() => {
    if (!displayStepId) return;
    const step = session?.steps.find((candidate) => candidate.stepId === displayStepId);
    setWritingDraft(step?.text ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayStepId]);

  const [consentGranted, setConsentGranted] = useState(false);
  const [phase, setPhase] = useState<Phase>("wizard");
  const [resultState, setResultState] = useState<ResultStepState | undefined>();

  const setContextMutation = useSetContext(sessionId ?? "");
  const submitAnswerMutation = useSubmitCalibrationAnswer(sessionId ?? "");
  const skipStepMutation = useSkipStep(sessionId ?? "");
  const grantConsentMutation = useGrantConsent();
  const completeReviewMutation = useCompleteCalibration(sessionId ?? "");
  const completeOnboardingMutation = useCompleteOnboarding();

  async function handleContextContinue() {
    if (!sessionId) return;
    // Consent is captured here, before the first writing sample is submitted (the backend gates the
    // write path, not session start). A failed grant surfaces via grantConsentMutation.isError in the
    // context branch below; only a granted author moves on to setContext + the first writing step.
    try {
      await grantConsentMutation.mutateAsync();
    } catch {
      return;
    }
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

  function handleSkipForNow() {
    completeOnboardingMutation.mutate(undefined, {
      onSuccess: () => {
        clearStoredSessionId();
        void navigate({ to: "/generate" });
      },
      onError: (error) =>
        pushToast({ id: "calibrate-finish-error", kind: "error", topic: t.onboarding.toast.finishError, message: describeCalibrationError(t, error) })
    });
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
    // Consent was already granted on the context step — the review action just builds the voice.
    try {
      await completeReviewMutation.mutateAsync({});
    } catch (error) {
      setResultState({ kind: "error", message: describeCalibrationError(t, error), onRetry: handleCreateVoice });
      setPhase("result");
    }
  }

  function handleBridgeContinue() {
    completeOnboardingMutation.mutate(undefined, {
      onSuccess: () => {
        clearStoredSessionId();
        if (!companionOpen) toggleCompanion();
        void navigate({ to: "/generate" });
      },
      onError: (error) =>
        pushToast({ id: "calibrate-finish-error", kind: "error", topic: t.onboarding.toast.finishError, message: describeCalibrationError(t, error) })
    });
  }

  // completeReview only returns the session (status flips to "completed") — confidence/prose come
  // from the voiceProfile the mutation's onSuccess already invalidated, so the ready result waits
  // here for that refetch instead of assuming it's already in cache.
  useEffect(() => {
    if (phase !== "wizard" || !completeReviewMutation.isSuccess || !session) return;
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
              setPhase("wizard");
            }
          }
        : undefined,
      trialLine: formatCalibrationTrialLine(t, entitlementQuery.data, new Date()),
      onContinue: () => setPhase("bridge")
    });
    setPhase("result");
  }, [phase, completeReviewMutation.isSuccess, voiceProfileQuery.data, session, entitlementQuery.data, t]);

  function buildWizardContent(stepId: string): WizardStepContent | undefined {
    if (!session) return undefined;

    if (stepId === CONTEXT_STEP_ID) {
      // Continuar first grants consent, then derives the seed practice profile server-side (LLM in
      // the loop) — a multi-second wait, and no "continue anyway" escape on failure (a generic sample
      // would permanently poison the profile). Reuses the wizard's existing building/error vocabulary
      // (steps 6/7) instead of a bespoke one; the retry button just re-fires the same mutation.
      if (grantConsentMutation.isError || setContextMutation.isError) {
        const error = setContextMutation.error ?? grantConsentMutation.error;
        return {
          kind: "result",
          props: { state: { kind: "error", message: describeCalibrationError(t, error), onRetry: handleContextContinue } }
        };
      }
      const contextPending = grantConsentMutation.isPending || setContextMutation.isPending;
      if (contextPending) {
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
          pending: contextPending,
          onSkipForNow: handleSkipForNow,
          consent: { granted: consentGranted, onToggle: setConsentGranted }
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
              trialLine: formatCalibrationTrialLine(t, entitlementQuery.data, new Date()),
              onSkipForNow: handleSkipForNow
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

  if (postReset) {
    return (
      <PostResetReturn
        name={firstName(auth.user?.name, t.onboarding.nameFallback)}
        resetDate={postReset.resetDate}
        priorContext={{ topic: postReset.topic, audience: postReset.audience }}
        onResume={() => {
          setAudiences([postReset.audience]);
          clearPostResetContext();
          setPostReset(undefined);
        }}
        onFresh={() => {
          clearPostResetContext();
          setPostReset(undefined);
        }}
      />
    );
  }

  if (startMutation.isError && !sessionId) {
    return (
      <div className="wizard-full-screen">
        <div className="wizard-full-inner">
          <p>{t.onboarding.toast.startFailed}</p>
          <Pill
            onClick={() => {
              startedRef.current = false;
              startMutation.reset();
            }}
          >
            {t.common.retry}
          </Pill>
        </div>
      </div>
    );
  }

  if (phase === "bridge") {
    return (
      <CalibrationWizard
        variant="full"
        progress={[]}
        content={{ kind: "bridge", props: { onContinue: handleBridgeContinue, onSkipTour: handleBridgeContinue } }}
      />
    );
  }

  if (!session || !displayStepId) return null;

  if (phase === "result" && resultState) {
    return <CalibrationWizard variant="full" progress={buildProgress(t, session, displayStepId)} content={{ kind: "result", props: { state: resultState } }} />;
  }

  const content = buildWizardContent(displayStepId);
  if (!content) return null;

  return <CalibrationWizard variant="full" progress={buildProgress(t, session, displayStepId)} content={content} />;
}
