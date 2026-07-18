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
  useVoiceProfile
} from "@my-ai-orchestrator/shared";
import { Pill } from "@my-ai-orchestrator/ui/app/primitives";
import { CalibrationWizard, type ResultStepState, type WizardStepContent } from "@my-ai-orchestrator/ui/app/onboarding";
import { PostResetReturn } from "@my-ai-orchestrator/ui/app/states";
import {
  buildProgress,
  buildVoicePreviewVM,
  clearPostResetContext,
  clearStoredSessionId,
  CONTEXT_STEP_ID,
  describeCalibrationError,
  formatCalibrationTrialLine,
  formatResetDate,
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

function firstName(name: string | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? "você";
}

type Phase = "wizard" | "result" | "bridge";

// Container for /app/calibrate (route wired by router.tsx, out of scope here — beforeLoad is
// auth-only, no loader). No router loader available, so the session is created/resumed on mount
// instead of via ensureQueryData; localStorage carries the sessionId across reloads.
export function CalibrateContainer() {
  const navigate = useNavigate();
  const { auth } = useRouteContext({ from: "/calibrate" });
  const companionOpen = useShellStore((state) => state.companionOpen);
  const toggleCompanion = useShellStore((state) => state.toggleCompanion);
  const pushToast = useToastStore((state) => state.push);

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

  const [domain, setDomain] = useState("");
  const [audience, setAudience] = useState("");
  const [strength, setStrength] = useState("");
  const contextInitRef = useRef(false);
  useEffect(() => {
    if (!session?.context || contextInitRef.current) return;
    contextInitRef.current = true;
    setDomain(session.context.domain ?? "");
    setAudience(session.context.audience ?? "");
    setStrength(session.context.selfDeclaredStrength ?? "");
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

  function handleContextContinue() {
    if (!sessionId) return;
    setContextMutation.mutate(
      { domain: domain.trim(), audience: audience.trim(), selfDeclaredStrength: strength.trim() || undefined },
      { onSuccess: (updated) => setDisplayStepId(updated.currentStepId) }
    );
  }

  function handleSkipForNow() {
    completeOnboardingMutation.mutate(undefined, {
      onSuccess: () => {
        clearStoredSessionId();
        void navigate({ to: "/generate" });
      }
    });
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
      setPhase("result");
    }
  }

  function handleBridgeContinue() {
    clearStoredSessionId();
    if (!companionOpen) toggleCompanion();
    void navigate({ to: "/generate" });
  }

  // completeReview only returns the session (status flips to "completed") — confidence/prose come
  // from the voiceProfile the mutation's onSuccess already invalidated, so the ready result waits
  // here for that refetch instead of assuming it's already in cache.
  useEffect(() => {
    if (phase !== "wizard" || !completeReviewMutation.isSuccess || !session) return;
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
              setPhase("wizard");
            }
          }
        : undefined,
      trialLine: formatCalibrationTrialLine(entitlementQuery.data, new Date()),
      onContinue: () => setPhase("bridge")
    });
    setPhase("result");
  }, [phase, completeReviewMutation.isSuccess, voiceProfileQuery.data, session, entitlementQuery.data]);

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
          pending: setContextMutation.isPending,
          onSkipForNow: handleSkipForNow
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
              trialLine: formatCalibrationTrialLine(entitlementQuery.data, new Date()),
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

  if (postReset) {
    return (
      <PostResetReturn
        name={firstName(auth.user?.name)}
        resetDate={formatResetDate(postReset.resetDate)}
        priorContext={{ topic: postReset.topic, audience: postReset.audience }}
        onResume={() => {
          setAudience(postReset.audience);
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
          <p>não conseguimos iniciar a sua calibração agora.</p>
          <Pill
            onClick={() => {
              startedRef.current = false;
              startMutation.reset();
            }}
          >
            Tentar de novo
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
    return <CalibrationWizard variant="full" progress={buildProgress(session, displayStepId)} content={{ kind: "result", props: { state: resultState } }} />;
  }

  const content = buildWizardContent(displayStepId);
  if (!content) return null;

  return <CalibrationWizard variant="full" progress={buildProgress(session, displayStepId)} content={content} />;
}
