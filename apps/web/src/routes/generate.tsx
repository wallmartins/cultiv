import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { GenerationPreviewRequest } from "@my-ai-orchestrator/contracts";
import {
  useEntitlement,
  useExecutionsList,
  useGenerate,
  useGeneratePrefill,
  useGenreInference,
  usePracticeProfile,
  usePreview,
  useToastStore,
  useUiLanguage,
  useVoiceProfile,
  useWizardSessionStore
} from "@my-ai-orchestrator/shared";
import { GenerateSurface, type ComposerRegion } from "@my-ai-orchestrator/ui/app/generate";
import { PaymentPendingZeroCredits } from "@my-ai-orchestrator/ui/app/states";
import { useMessages } from "@my-ai-orchestrator/ui/app/i18n";
import {
  buildBriefing,
  buildGuidedSteps,
  buildThreadMessages,
  CHANNEL_STEP_ID,
  commonDenominatorAudience,
  countRunning,
  detectedPlatformChannel,
  fallbackQuestionPlan,
  formatCostLabel,
  formatQueueEta,
  formatTrialLine,
  generateBlockedReason,
  isLastTrialGeneration,
  looksLikeMarkdown,
  mergeAudienceOptions,
  parsePastedTheme,
  platformOptions,
  questionEyebrow,
  questionStepCount,
  resolveNarrowingBuffer,
  type PastedThemeParse
} from "./generate-view.js";

// S3 — container for /app/generate: wires wizard-session + Fase A hooks into GenerateSurface's
// props. packages/ui/app/generate stays props-in; this is the only file that touches hooks/router.
export function GenerateContainer() {
  const navigate = useNavigate();
  const t = useMessages();

  const {
    phase,
    theme,
    audience,
    channel,
    prefill,
    genre,
    questionPlan,
    answers,
    qIndex,
    setTheme,
    beginNarrowing,
    confirmAudience,
    setPrefillResult,
    setChannel,
    setGenre,
    submitAnswer,
    skip,
    startFiring,
    cancelFiring,
    reset
  } = useWizardSessionStore();

  const [draft, setDraft] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | undefined>();
  const [pastedPreview, setPastedPreview] = useState<PastedThemeParse | undefined>();
  const [audienceDraft, setAudienceDraft] = useState("");
  const [ephemeralAudiences, setEphemeralAudiences] = useState<readonly string[]>([]);

  const prefillMutation = useGeneratePrefill();
  const generateMutation = useGenerate();
  const genreMutation = useGenreInference();
  const practiceProfile = usePracticeProfile();
  const entitlement = useEntitlement();
  const voiceProfile = useVoiceProfile();
  const uiLanguage = useUiLanguage((state) => state.language);
  const pushToast = useToastStore((state) => state.push);
  // Same "all" query the shell's running-watch keeps warm (packages/shared useRunningExecutionsWatch)
  // — same queryKey, so this is a cache hit rather than a second network round-trip.
  const runningExecutions = useExecutionsList({ status: "all", limit: 20 });

  const steps = buildGuidedSteps(t, questionPlan);
  const currentStep = steps[qIndex];
  const briefing = buildBriefing(theme, steps, answers, audience);
  const options = platformOptions(t);
  const declaredAudiences = practiceProfile.data?.profile?.audiences ?? [];
  const audienceOptions = mergeAudienceOptions(declaredAudiences, ephemeralAudiences);

  // F4-7 — genre is inferred once, at the end of the questions; until it resolves (or the call
  // itself fails), the same "expound" default the pipeline has always used carries the request.
  const rhetoricalMode = genre?.rhetoricalMode.dominant ?? prefill?.rhetoricalMode ?? "expound";
  const previewInput: GenerationPreviewRequest = {
    rhetoricalMode,
    scope: channel ? { ...(prefill?.scope ?? defaultScope()), channel } : prefill?.scope,
    briefing,
    includeRecommendation: true
  };
  const previewQuery = usePreview(previewInput, phase === "thread");

  // Fires once, right as the author clears the last question (before channel/preview) — the
  // dominant mode it returns then drives both the preview quote and the generate call below, so
  // the price the author sees matches the pipeline that actually runs.
  const questionsDone = phase === "thread" && qIndex >= questionStepCount(steps);
  const genreFiredRef = useRef(false);
  useEffect(() => {
    if (!questionsDone || genreFiredRef.current) return;
    genreFiredRef.current = true;
    genreMutation.mutate(
      { briefing, language: uiLanguage },
      { onSuccess: (response) => setGenre(response.genre) }
      // No onError: the call itself failing degrades to the "expound" default above, same as
      // before F4-7 — genre is an enrichment, never a blocker.
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionsDone]);

  const blockedReason = generateBlockedReason(t, entitlement.data);
  const costLabel = formatCostLabel(t, previewQuery.data, entitlement.data?.canonicalCreditCost);
  const trialLine = formatTrialLine(t, entitlement.data, new Date());
  const runningCount = countRunning(runningExecutions.data);
  const showQueueGate = isLastTrialGeneration(entitlement.data) && runningCount >= 2;

  function runPrefill(submittedTheme: string, narrowedAudience: string | undefined) {
    prefillMutation.mutate(
      { theme: submittedTheme, audience: narrowedAudience },
      {
        onSuccess: (response) => {
          setSelectedPlatformId(detectedPlatformChannel(response.detectedPlatform));
          setPrefillResult({
            prefill: response.prefill,
            questionPlan: response.questionPlan
          });
        },
        // Silent fallback (ADR 0004 §3) — inference failure never blocks the flow.
        onError: () => {
          setPrefillResult({
            prefill: { rhetoricalMode: "expound", scope: defaultScope() },
            questionPlan: fallbackQuestionPlan(t, submittedTheme)
          });
        }
      }
    );
  }

  // F4-2 (ADR 0010 §6) — audience narrowing sits between the theme and the prefill call, since
  // the prefill's slot questions are written per narrowed audience. 0-1 declared audiences has
  // nothing to narrow between and goes straight to prefill; 2+ renders the chip step.
  function submitTheme(submittedThemeRaw: string) {
    const submittedTheme = submittedThemeRaw.trim();
    if (!submittedTheme) return;
    setTheme(submittedTheme);

    const buffer = resolveNarrowingBuffer(declaredAudiences);
    if (buffer.kind === "narrow") {
      beginNarrowing();
      return;
    }
    confirmAudience(buffer.audience);
    runPrefill(submittedTheme, buffer.audience);
  }

  function handleThemeSubmit() {
    submitTheme(draft);
  }

  function chooseAudience(selected: string) {
    confirmAudience(selected);
    runPrefill(theme, selected);
  }

  function declineNarrowing() {
    const combined = commonDenominatorAudience(declaredAudiences);
    confirmAudience(combined);
    runPrefill(theme, combined);
  }

  function addAudience() {
    const value = audienceDraft.trim();
    if (!value) return;
    setEphemeralAudiences((prev) => mergeAudienceOptions(prev, [value]));
    setAudienceDraft("");
    chooseAudience(value);
  }

  // 2g — a paste that looks like markdown detours into "entendi assim, confirma?" instead of
  // going straight into the raw textarea (breakdown-15 §1).
  function handleThemePaste(pastedText: string) {
    if (!looksLikeMarkdown(pastedText)) return;
    setDraft(pastedText);
    setPastedPreview(parsePastedTheme(t, pastedText));
  }

  function submitCurrentAnswer() {
    if (!currentStep || currentStep.kind === "channel") return;
    submitAnswer(currentStep.id, answerDraft.trim());
    setAnswerDraft("");
  }

  function skipCurrentStep() {
    if (!currentStep) return;
    skip(currentStep.id);
    setAnswerDraft("");
  }

  function selectPlatform(optionId: string) {
    const option = options.find((candidate) => candidate.id === optionId);
    if (!option) return;
    setSelectedPlatformId(optionId);
    setChannel(option.channel);
    submitAnswer(CHANNEL_STEP_ID, option.label);
  }

  function handleGenerate() {
    if (!prefill || blockedReason) return;
    startFiring();
    generateMutation.mutate(
      {
        // Same rhetoricalMode the preview above priced — quoteId hashes the plan it was quoted
        // under, so preview and generate have to agree on the mode or the quote goes stale.
        rhetoricalMode,
        genre,
        scope: channel ? { ...(prefill.scope ?? defaultScope()), channel } : prefill.scope,
        briefing,
        // quoteId hashes the quality mode it was priced under, so the mode has to travel with
        // it — otherwise the backend re-defaults (config QUALITY_MODE) and rejects as quote_stale.
        qualityMode: previewQuery.data?.pricingSnapshot.qualityMode,
        quoteId: previewQuery.data?.pricingSnapshot.quoteId,
        previewRecommendation: previewQuery.data?.recommendation
      },
      {
        onSuccess: (queued) => {
          reset();
          void navigate({ to: "/g/$executionId", params: { executionId: queued.jobId } });
        },
        // Breakdown-08 §3 state 12 — dispatch failure is first-class, never a silent revert:
        // honest copy (credits weren't charged, retry is free) alongside the phase rollback.
        onError: () => {
          cancelFiring();
          pushToast({
            id: "dispatch-error",
            kind: "error",
            topic: theme,
            message: t.generate.dispatchError
          });
        }
      }
    );
  }

  const composerRegion: ComposerRegion | undefined =
    phase === "narrowing"
      ? {
          kind: "audience",
          props: {
            eyebrow: t.generate.audienceEyebrow,
            prompt: t.generate.audiencePrompt,
            options: audienceOptions,
            onSelect: chooseAudience,
            onUseCommonDenominator: declineNarrowing,
            addValue: audienceDraft,
            onAddChange: setAudienceDraft,
            onAddSubmit: addAudience
          }
        }
      : phase !== "thread"
        ? undefined
        : !currentStep
          ? showQueueGate
            ? {
                kind: "queue-gate",
                props: {
                  runningCount,
                  queueEta: formatQueueEta(t, runningCount),
                  onUseLast: handleGenerate,
                  // No drafts contract exists — the session itself already survives navigation
                  // (wizard-session is a store, not route state), so "for later" is just leaving.
                  onSaveForLater: () => navigate({ to: "/generate" }),
                  onViewPlans: () => navigate({ to: "/plans" })
                }
              }
            : { kind: "done", props: { onGenerate: handleGenerate, disabled: Boolean(blockedReason) } }
          : currentStep.kind === "channel"
            ? {
                kind: "channel",
                props: {
                  eyebrow: t.generate.channelEyebrow,
                  prompt: currentStep.prompt,
                  options: options.map((option) => ({
                    id: option.id,
                    label: option.label,
                    active: option.id === selectedPlatformId
                  })),
                  onSelect: selectPlatform,
                  onSkip: skipCurrentStep
                }
              }
            : {
                kind: "question",
                props: {
                  eyebrow: questionEyebrow(t, qIndex, questionStepCount(steps)),
                  prompt: currentStep.prompt,
                  note: currentStep.note,
                  value: answerDraft,
                  onChange: setAnswerDraft,
                  onSubmit: submitCurrentAnswer,
                  onSkip: skipCurrentStep
                }
              };

  // 1d — generation paywall: gate.past_due already means "dunning e sem créditos" server-side
  // (BillingGenerationGateSchema), so it's the one real field this needs to check.
  if (entitlement.data?.gate === "past_due") {
    return (
      <PaymentPendingZeroCredits
        planName={entitlement.data.tier.charAt(0).toUpperCase() + entitlement.data.tier.slice(1)}
        cycleCredits={entitlement.data.monthlyCreditsRemaining}
        onRegularize={() => navigate({ to: "/billing" })}
      />
    );
  }

  return (
    <GenerateSurface
      phase={phase}
      hero={{ value: draft, onChange: setDraft, onSubmit: handleThemeSubmit, onPaste: handleThemePaste, trialLine }}
      pastedPreview={
        pastedPreview
          ? {
              pasted: draft,
              title: pastedPreview.title,
              channel: pastedPreview.channel,
              angles: pastedPreview.angles,
              linkCount: pastedPreview.linkCount,
              onUseAsPasted: () => {
                setPastedPreview(undefined);
                submitTheme(draft);
              },
              onConfirm: () => {
                setPastedPreview(undefined);
                submitTheme(pastedPreview.title);
              }
            }
          : undefined
      }
      messages={buildThreadMessages(theme, steps, answers)}
      composerRegion={composerRegion}
      costBand={phase === "thread" && !showQueueGate ? { costLabel, onGenerate: handleGenerate, blockedReason } : undefined}
      voiceNotice={
        voiceProfile.data?.diagnostics.pendingRebuild.status === "failed"
          ? { text: t.generate.voiceRebuildNotice, onReview: () => navigate({ to: "/voice" }) }
          : undefined
      }
    />
  );
}

// ponytail: no ticket yet — lengthTier (short/medium/long) has no author-facing picker; F4-7's
// genre producer only covers rhetoricalMode/epistemicPosture, not size. Hardcoded until one lands.
function defaultScope() {
  return { lengthTier: "short" as const };
}
