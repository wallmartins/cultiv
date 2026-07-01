import { Button, cn, CoordinateLabel, LogbookProse, RouteLine, Text } from "@my-ai-orchestrator/ui";
import type {
  VoiceCalibrationSessionView,
  VoiceCalibrationStepPromptView,
  VoiceProfileScreenView
} from "@my-ai-orchestrator/contracts";
import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WizardStep, wizardStepCanAdvance } from "~/app/onboarding/components/WizardStep";
import {
  CALIBRATION_WIZARD_STEP_IDS,
  isWritableWizardStep,
  resolveWizardStepIndex,
  WIZARD_AUDIENCE_OPTIONS,
  WIZARD_DOMAIN_OPTIONS,
  type WizardAudienceOption,
  type WizardDomainOption
} from "~/app/onboarding/lib/onboarding-steps";
import {
  isWizardReviewStep,
  resolveDevelopmentReviewBody,
  shouldPollVoiceProfileOnReview
} from "~/app/onboarding/lib/voice-calibration-review";
import { VoiceTrainingConsentModal } from "~/app/voice/components/VoiceTrainingConsentModal";
import { grantVoiceConsent, hasVoiceConsent } from "~/app/voice/lib/voice-consent-storage";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";

export interface VoiceCalibrationSessionProps {
  readonly onComplete: () => void;
  readonly onSkip?: () => void;
}

type Phase = "pre" | "wizard";

function ContextChip({
  label,
  selected,
  onSelect
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-[5px] border px-3 py-2 font-inter text-sm transition-colors duration-200 motion-reduce:transition-none",
        selected
          ? "border-terracotta bg-terracotta/10 text-ink"
          : "border-dotted-cartography bg-cream text-ink-muted hover:border-ink-ghost/60 hover:text-ink"
      )}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

function WizardStepIndicator({
  currentIndex,
  labels,
  stepIndicatorLabel
}: {
  readonly currentIndex: number;
  readonly labels: readonly string[];
  readonly stepIndicatorLabel: string;
}) {
  const total = labels.length;
  const progress = total <= 1 ? 1 : Math.min(1, Math.max(0, currentIndex / (total - 1)));

  return (
    <nav
      aria-label={stepIndicatorLabel
        .replace("{current}", String(currentIndex + 1))
        .replace("{total}", String(total))}
      className="mb-6"
    >
      <div
        className="relative mb-3 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      >
        {total > 1 ? (
          <div
            className="pointer-events-none absolute inset-x-[8%] top-[0.55rem] h-px"
            aria-hidden="true"
          >
            <RouteLine progress={progress} orientation="horizontal" animate className="h-px w-full" />
          </div>
        ) : null}
        {labels.map((label, index) => {
          const isActive = index === currentIndex;
          const isDone = index < currentIndex;

          return (
            <div key={label} className="relative flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "relative z-10 flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full border text-[0.625rem] font-mono transition-colors duration-200 motion-reduce:transition-none",
                  isDone
                    ? "border-moss bg-moss text-cream"
                    : isActive
                      ? "border-terracotta bg-cream text-terracotta"
                      : "border-ink-ghost/60 bg-cream text-ink-muted"
                )}
                aria-hidden="true"
              >
                {isDone ? "✓" : index + 1}
              </span>
              <Text variant="meta" className={cn("hidden text-[0.65rem] sm:block", isActive && "text-ink")}>
                {label}
              </Text>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

const REVIEW_PROFILE_POLL_MS = 2_000;
const REVIEW_PROFILE_POLL_MAX = 30;

export function VoiceCalibrationSession({ onComplete, onSkip }: VoiceCalibrationSessionProps) {
  const { user } = useAuth0();
  const { messages } = useAppLocale();
  const client = useClientSdk();
  const copy = messages.onboarding.voiceCalibration;
  const userId = user?.sub;

  const [phase, setPhase] = useState<Phase>("pre");
  const [domain, setDomain] = useState<WizardDomainOption | "">("");
  const [audience, setAudience] = useState<WizardAudienceOption | "">("");
  const [strength, setStrength] = useState("");
  const [session, setSession] = useState<VoiceCalibrationSessionView | null>(null);
  const [prompt, setPrompt] = useState<VoiceCalibrationStepPromptView | null>(null);
  const [draftText, setDraftText] = useState("");
  const [uiStepIndex, setUiStepIndex] = useState(0);
  const [profile, setProfile] = useState<VoiceProfileScreenView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [consentOpen, setConsentOpen] = useState(false);
  const [confirmedSections, setConfirmedSections] = useState<ReadonlySet<string>>(() => new Set());

  const stepLabels = useMemo(
    () => CALIBRATION_WIZARD_STEP_IDS.map((id) => copy.stepLabels[id] ?? id),
    [copy.stepLabels]
  );

  const currentStepId = session?.currentStepId ?? CALIBRATION_WIZARD_STEP_IDS[0];
  const isReviewStep = isWizardReviewStep(uiStepIndex);
  const serverStepIndex = resolveWizardStepIndex(currentStepId);
  const viewingPastStep = uiStepIndex < serverStepIndex;
  const viewingFutureStep = uiStepIndex > serverStepIndex;
  const isProfileUpdating = profile?.diagnostics?.updating === true;
  const thinkingBody = profile?.reasoning?.core.narrativeProse?.trim();
  const developmentBody = resolveDevelopmentReviewBody(profile, session);

  const loadPrompt = useCallback(
    async (sessionId: string, stepId: string) => {
      const nextPrompt = await client.toPromise(
        client.voiceCalibration.getStepPrompt({ sessionId, stepId })
      );
      setPrompt(nextPrompt);
    },
    [client]
  );

  const syncDraftFromSession = useCallback(
    (nextSession: VoiceCalibrationSessionView, stepId: string) => {
      const stepState = nextSession.steps.find((step) => step.stepId === stepId);
      setDraftText(stepState?.text ?? "");
    },
    []
  );

  useEffect(() => {
    if (phase !== "wizard" || !session || isReviewStep) {
      return;
    }

    const stepId = CALIBRATION_WIZARD_STEP_IDS[uiStepIndex];
    if (!stepId || stepId === "review_confirm") {
      return;
    }

    if (viewingFutureStep) {
      return;
    }

    void loadPrompt(session.sessionId, stepId)
      .then(() => syncDraftFromSession(session, stepId))
      .catch(() => setError(copy.loadError));
  }, [copy.loadError, isReviewStep, loadPrompt, phase, session, syncDraftFromSession, uiStepIndex, viewingFutureStep]);

  useEffect(() => {
    if (!isReviewStep || phase !== "wizard" || !session) {
      return;
    }

    let cancelled = false;
    let pollAttempt = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    const stopPolling = () => {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };

    async function refreshProfile() {
      try {
        const next = await client.toPromise(client.voice.getProfile());
        if (cancelled) {
          return;
        }

        setProfile(next);
        setError(undefined);
        pollAttempt += 1;

        if (!shouldPollVoiceProfileOnReview(next, pollAttempt, REVIEW_PROFILE_POLL_MAX)) {
          stopPolling();
        }
      } catch {
        if (!cancelled) {
          setError(copy.loadError);
        }
        stopPolling();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    void refreshProfile();

    timer = setInterval(() => {
      void refreshProfile();
    }, REVIEW_PROFILE_POLL_MS);

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [client, copy.loadError, isReviewStep, phase, session]);

  function beginWizard() {
    if (!domain || !audience) {
      setError(copy.contextRequired);
      return;
    }

    if (userId && !hasVoiceConsent(userId)) {
      setConsentOpen(true);
      return;
    }

    void startWizardSession();
  }

  async function startWizardSession() {
    setLoading(true);
    setError(undefined);

    try {
      const started = await client.toPromise(client.voiceCalibration.startSession());
      const withContext = await client.toPromise(
        client.voiceCalibration.setContext({
          sessionId: started.sessionId,
          domain,
          audience,
          ...(strength.trim() ? { selfDeclaredStrength: strength.trim().slice(0, 200) } : {})
        })
      );

      setSession(withContext);
      setUiStepIndex(0);
      setPhase("wizard");
      await loadPrompt(withContext.sessionId, withContext.currentStepId);
      syncDraftFromSession(withContext, withContext.currentStepId);
    } catch {
      setError(copy.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitStep() {
    if (!session || !prompt || !isWritableWizardStep(prompt.stepId)) {
      return;
    }

    if (!wizardStepCanAdvance(prompt.targetWords, draftText)) {
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const nextSession = await client.toPromise(
        client.voiceCalibration.submitStep({
          sessionId: session.sessionId,
          stepId: prompt.stepId,
          text: draftText
        })
      );

      setSession(nextSession);
      const nextIndex = resolveWizardStepIndex(nextSession.currentStepId);
      setUiStepIndex(nextIndex >= 0 ? nextIndex : uiStepIndex + 1);
      setDraftText("");

      if (nextSession.currentStepId !== "review_confirm") {
        await loadPrompt(nextSession.sessionId, nextSession.currentStepId);
        syncDraftFromSession(nextSession, nextSession.currentStepId);
      }
    } catch {
      setError(copy.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function handleSkipStep() {
    if (!session || !prompt || !isWritableWizardStep(prompt.stepId)) {
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const nextSession = await client.toPromise(
        client.voiceCalibration.skipStep({
          sessionId: session.sessionId,
          stepId: prompt.stepId
        })
      );

      setSession(nextSession);
      const nextIndex = resolveWizardStepIndex(nextSession.currentStepId);
      setUiStepIndex(nextIndex >= 0 ? nextIndex : uiStepIndex + 1);
      setDraftText("");
    } catch {
      setError(copy.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteReview() {
    if (!session) {
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      await client.toPromise(
        client.voiceCalibration.completeReview({
          sessionId: session.sessionId,
          confirmedSections: [...confirmedSections]
        })
      );
      onComplete();
    } catch {
      setError(copy.loadError);
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    if (uiStepIndex <= 0) {
      setPhase("pre");
      return;
    }

    const prevIndex = uiStepIndex - 1;
    const prevStepId = CALIBRATION_WIZARD_STEP_IDS[prevIndex];
    setUiStepIndex(prevIndex);

    if (session && prevStepId && prevStepId !== "review_confirm") {
      syncDraftFromSession(session, prevStepId);
      void loadPrompt(session.sessionId, prevStepId).catch(() => setError(copy.loadError));
    }
  }

  function handleForward() {
    if (viewingPastStep) {
      setUiStepIndex((current) => Math.min(current + 1, CALIBRATION_WIZARD_STEP_IDS.length - 1));
      return;
    }

    if (isReviewStep) {
      void handleCompleteReview();
      return;
    }

    void handleSubmitStep();
  }

  const canContinue = isReviewStep
    ? ["thinking", "development", "consistency"].every((section) => confirmedSections.has(section)) &&
      !loading
    : viewingPastStep
      ? true
      : wizardStepCanAdvance(prompt?.targetWords, draftText) && !loading && !viewingFutureStep;

  if (phase === "pre") {
    return (
      <div className="workspace-stagger-group space-y-6">
        <VoiceTrainingConsentModal
          open={consentOpen}
          onCancel={() => setConsentOpen(false)}
          onAccept={() => {
            if (userId) {
              grantVoiceConsent(userId);
            }
            setConsentOpen(false);
            void startWizardSession();
          }}
        />

        <div>
          <Text as="h1" variant="h1" className="mb-3 font-playfair text-ink">
            {copy.preTitle}
          </Text>
          <Text variant="body" className="text-ink-muted">
            {copy.preSubtitle}
          </Text>
        </div>

        <LogbookProse className="space-y-6 p-5">
          <div className="space-y-3">
            <CoordinateLabel index={1} label={copy.domainQuestion} className="block" />
            <div className="flex flex-wrap gap-2">
              {WIZARD_DOMAIN_OPTIONS.map((option) => (
                <ContextChip
                  key={option}
                  label={copy.domainOptions[option]}
                  selected={domain === option}
                  onSelect={() => setDomain(option)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <CoordinateLabel index={2} label={copy.audienceQuestion} className="block" />
            <div className="flex flex-wrap gap-2">
              {WIZARD_AUDIENCE_OPTIONS.map((option) => (
                <ContextChip
                  key={option}
                  label={copy.audienceOptions[option]}
                  selected={audience === option}
                  onSelect={() => setAudience(option)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <CoordinateLabel index={3} label={copy.strengthQuestion} className="block" />
            <textarea
              value={strength}
              onChange={(event) => setStrength(event.target.value.slice(0, 200))}
              rows={3}
              placeholder={copy.strengthPlaceholder}
              className="w-full resize-y rounded-[5px] border border-dotted-cartography bg-cream px-4 py-3 font-inter text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            />
          </div>
        </LogbookProse>

        {error ? (
          <Text variant="meta" className="text-terracotta">
            {error}
          </Text>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {onSkip ? (
            <Button type="button" variant="ghost" onClick={onSkip} disabled={loading}>
              {messages.onboarding.skip}
            </Button>
          ) : null}
          <Button type="button" onClick={beginWizard} disabled={loading || !domain || !audience}>
            {loading ? copy.submitting : messages.onboarding.continue}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-stagger-group space-y-6">
      <div>
        <Text as="h1" variant="h1" className="mb-3 font-playfair text-ink">
          {copy.wizardTitle}
        </Text>
        <Text variant="body" className="text-ink-muted">
          {copy.wizardSubtitle}
        </Text>
      </div>

      <WizardStepIndicator
        currentIndex={uiStepIndex}
        labels={stepLabels}
        stepIndicatorLabel={copy.stepIndicator}
      />

      {isReviewStep ? (
        <div className="space-y-4">
          {loading && !profile ? (
            <AppSkeleton className="h-40 w-full" />
          ) : (
            <>
              <ReviewSection
                title={copy.reviewThinking}
                body={thinkingBody}
                loading={isProfileUpdating && !thinkingBody}
                loadingLabel={copy.loadingProfile}
                confirmed={confirmedSections.has("thinking")}
                confirmLabel={copy.confirmSection}
                onConfirm={() =>
                  setConfirmedSections((current) => new Set([...current, "thinking"]))
                }
              />
              <ReviewSection
                title={copy.reviewDevelopment}
                body={developmentBody}
                loading={isProfileUpdating && !developmentBody}
                loadingLabel={copy.loadingProfile}
                confirmed={confirmedSections.has("development")}
                confirmLabel={copy.confirmSection}
                onConfirm={() =>
                  setConfirmedSections((current) => new Set([...current, "development"]))
                }
              />
              <LogbookProse className="space-y-3 p-5">
                <Text variant="label" className="block">
                  {copy.reviewConsistency}
                </Text>
                {profile?.quantitativeSignals ? (
                  <div className="space-y-1">
                    <Text variant="body" className="text-ink">
                      {copy.consistencyScore.replace(
                        "{score}",
                        profile.quantitativeSignals.consistencyScore.toFixed(2)
                      )}
                    </Text>
                    <Text variant="body" className="text-ink">
                      {copy.topicIndependenceScore.replace(
                        "{score}",
                        profile.quantitativeSignals.topicIndependenceScore.toFixed(2)
                      )}
                    </Text>
                  </div>
                ) : (
                  <Text variant="meta" className="text-ink-muted">
                    {copy.loadingProfile}
                  </Text>
                )}
                <Button
                  type="button"
                  variant={confirmedSections.has("consistency") ? "ghost" : "primary"}
                  onClick={() =>
                    setConfirmedSections((current) => new Set([...current, "consistency"]))
                  }
                >
                  {copy.confirmSection}
                </Button>
              </LogbookProse>
            </>
          )}
        </div>
      ) : prompt ? (
        <WizardStep
          label={stepLabels[uiStepIndex] ?? prompt.stepId}
          prompt={prompt.prompt}
          theme={prompt.theme}
          text={draftText}
          onTextChange={setDraftText}
          targetWords={prompt.targetWords}
          maxWords={prompt.maxWords}
          wordCountLabel={copy.wordCount}
          minWordsHint={copy.wordCountMin}
          readOnly={viewingPastStep}
        />
      ) : (
        <AppSkeleton className="h-40 w-full" />
      )}

      {error ? (
        <Text variant="meta" className="text-terracotta">
          {error}
        </Text>
      ) : null}

      {!isReviewStep && prompt && isWritableWizardStep(prompt.stepId) && !viewingPastStep ? (
        <Text variant="meta" className="text-ink-muted">
          {copy.skipPenalty}
        </Text>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="ghost" onClick={handleBack} disabled={loading}>
          {copy.back}
        </Button>
        {!isReviewStep && prompt && isWritableWizardStep(prompt.stepId) && !viewingPastStep ? (
          <Button type="button" variant="ghost" onClick={() => void handleSkipStep()} disabled={loading}>
            {copy.skipStep}
          </Button>
        ) : null}
        <Button type="button" onClick={handleForward} disabled={!canContinue}>
          {loading
            ? copy.submitting
            : isReviewStep
              ? copy.confirmAll
              : messages.onboarding.continue}
        </Button>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  body,
  loading,
  loadingLabel,
  confirmed,
  confirmLabel,
  onConfirm
}: {
  readonly title: string;
  readonly body?: string;
  readonly loading?: boolean;
  readonly loadingLabel: string;
  readonly confirmed: boolean;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
}) {
  return (
    <LogbookProse className="space-y-3 p-5">
      <Text variant="label" className="block">
        {title}
      </Text>
      {loading ? (
        <Text variant="body" className="text-ink-muted">
          {loadingLabel}
        </Text>
      ) : body ? (
        <Text variant="body" className="text-ink-muted">
          {body}
        </Text>
      ) : null}
      <Button
        type="button"
        variant={confirmed ? "ghost" : "primary"}
        onClick={onConfirm}
        disabled={confirmed || loading || !body}
      >
        {confirmLabel}
      </Button>
    </LogbookProse>
  );
}
