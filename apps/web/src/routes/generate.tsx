import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  PHASE1_DEFAULT_LENGTH_BY_INTENT,
  type GenerationIntent,
  type GenerationPreviewRequest
} from "@my-ai-orchestrator/contracts";
import {
  useEntitlement,
  useExecutionsList,
  useGenerate,
  useGeneratePrefill,
  usePreview,
  useToastStore,
  useWizardSessionStore
} from "@my-ai-orchestrator/shared";
import { GenerateSurface, type ComposerRegion } from "@my-ai-orchestrator/ui/app/generate";
import { PaymentPendingZeroCredits } from "@my-ai-orchestrator/ui/app/states";
import {
  buildBriefing,
  buildGuidedSteps,
  buildThreadMessages,
  CHANNEL_STEP_ID,
  countRunning,
  fallbackQuestionPlan,
  formatCostLabel,
  formatQueueEta,
  formatTrialLine,
  generateBlockedReason,
  isLastTrialGeneration,
  looksLikeMarkdown,
  parsePastedTheme,
  PLATFORM_OPTIONS,
  questionEyebrow,
  questionStepCount,
  type PastedThemeParse
} from "./generate-view.js";

// S3 — container for /app/generate: wires wizard-session + Fase A hooks into GenerateSurface's
// props. packages/ui/app/generate stays props-in; this is the only file that touches hooks/router.
export function GenerateContainer() {
  const navigate = useNavigate();

  const {
    phase,
    theme,
    channel,
    prefill,
    questionPlan,
    intentAmbiguity,
    answers,
    qIndex,
    setTheme,
    setPrefillResult,
    setChannel,
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

  const prefillMutation = useGeneratePrefill();
  const generateMutation = useGenerate();
  const entitlement = useEntitlement();
  const pushToast = useToastStore((state) => state.push);
  // Same "all" query the shell's running-watch keeps warm (packages/shared useRunningExecutionsWatch)
  // — same queryKey, so this is a cache hit rather than a second network round-trip.
  const runningExecutions = useExecutionsList({ status: "all", limit: 20 });

  const steps = buildGuidedSteps(questionPlan, intentAmbiguity, prefill?.intent);
  const currentStep = steps[qIndex];
  const briefing = buildBriefing(theme, steps, answers);

  // intent stays the original inference here (and in handleGenerate below) — the ambiguity answer
  // is drafting context, not an intent correction. Accepted risk for v1 (GAP #14, closed).
  const previewInput: GenerationPreviewRequest = {
    intent: prefill?.intent,
    scope: channel ? { ...(prefill?.scope ?? defaultScope(prefill?.intent)), channel } : prefill?.scope,
    briefing,
    includeRecommendation: true
  };
  const previewQuery = usePreview(previewInput, phase === "thread");

  const blockedReason = generateBlockedReason(entitlement.data);
  const costLabel = formatCostLabel(previewQuery.data, entitlement.data?.canonicalCreditCost);
  const trialLine = formatTrialLine(entitlement.data, new Date());
  const runningCount = countRunning(runningExecutions.data);
  const showQueueGate = isLastTrialGeneration(entitlement.data) && runningCount >= 2;

  function submitTheme(submittedThemeRaw: string) {
    const submittedTheme = submittedThemeRaw.trim();
    if (!submittedTheme) return;
    setTheme(submittedTheme);
    prefillMutation.mutate(
      { theme: submittedTheme },
      {
        onSuccess: (response) => {
          setSelectedPlatformId(response.detectedPlatform);
          setPrefillResult({
            prefill: response.prefill,
            questionPlan: response.questionPlan,
            intentAmbiguity: response.intentAmbiguity
          });
        },
        // Silent fallback (ADR 0004 §3) — inference failure never blocks the flow.
        onError: () => {
          setPrefillResult({
            prefill: { intent: "share-idea", scope: defaultScope("share-idea") },
            questionPlan: fallbackQuestionPlan(submittedTheme),
            intentAmbiguity: null
          });
        }
      }
    );
  }

  function handleThemeSubmit() {
    submitTheme(draft);
  }

  // 2g — a paste that looks like markdown detours into "entendi assim, confirma?" instead of
  // going straight into the raw textarea (breakdown-15 §1).
  function handleThemePaste(pastedText: string) {
    if (!looksLikeMarkdown(pastedText)) return;
    setDraft(pastedText);
    setPastedPreview(parsePastedTheme(pastedText));
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
    const option = PLATFORM_OPTIONS.find((candidate) => candidate.id === optionId);
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
        intent: prefill.intent,
        scope: channel ? { ...(prefill.scope ?? defaultScope(prefill.intent)), channel } : prefill.scope,
        briefing,
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
            message: "créditos não cobrados — tente de novo"
          });
        }
      }
    );
  }

  const composerRegion: ComposerRegion | undefined =
    phase !== "thread"
      ? undefined
      : !currentStep
        ? showQueueGate
          ? {
              kind: "queue-gate",
              props: {
                runningCount,
                queueEta: formatQueueEta(runningCount),
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
                eyebrow: "canal · opcional",
                prompt: currentStep.prompt,
                options: PLATFORM_OPTIONS.map((option) => ({
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
                eyebrow: questionEyebrow(qIndex, questionStepCount(steps)),
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
    />
  );
}

function defaultScope(intent: GenerationIntent | undefined) {
  return { lengthTier: PHASE1_DEFAULT_LENGTH_BY_INTENT[intent ?? "share-idea"] };
}
