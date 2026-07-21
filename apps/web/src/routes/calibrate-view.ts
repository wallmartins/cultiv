import type { BillingEntitlementView, VoiceCalibrationSessionView, VoiceProfileScreenView } from "@my-ai-orchestrator/contracts";
import { confidenceRingValue, creditsAsTexts } from "@my-ai-orchestrator/shared";
import type { VoicePreviewVM, WizardStepVM } from "@my-ai-orchestrator/ui/app/onboarding";
import { voiceSignalLabel, type AppMessages } from "@my-ai-orchestrator/ui/app/i18n";

// Mirrors apps/backend/.../product/voice/voice-calibration-service.ts CALIBRATION_WIZARD_STEPS
// (packages/domain — not importable from apps/web, no dependency edge) — ids/labels/word ranges
// duplicated locally, same convention as generate-view.ts's INTENT_LABEL.
export const CONTEXT_STEP_ID = "context_setup";
export const REVIEW_STEP_ID = "review_confirm";
export const WRITING_STEP_ORDER = [
  "micro_opinion",
  "reasoning_reflection",
  "argument_development",
  "format_adaptation"
] as const;
export const STEP_ORDER = [CONTEXT_STEP_ID, ...WRITING_STEP_ORDER, REVIEW_STEP_ID] as const;

// GAP-A (breakdown-11 §2.3) — no useStepPrompt/getStepPrompt hook exists yet in packages/shared,
// so targetWords/minWords/maxWords (VoiceCalibrationStepPromptView) aren't reachable through a
// hook. Fallback numbers per breakdown-11 §1.1 ("Ficha 5, mas server é SSOT") until that hook lands.
const WORD_TARGETS: Record<string, { readonly min: number; readonly target: number; readonly max: number }> = {
  micro_opinion: { min: 60, target: 60, max: 100 },
  reasoning_reflection: { min: 150, target: 150, max: 250 },
  argument_development: { min: 250, target: 250, max: 400 },
  format_adaptation: { min: 180, target: 180, max: 300 }
};

export function stepLabel(t: AppMessages, stepId: string): string {
  const label: Record<string, string> = t.onboarding.stepLabel;
  return label[stepId] ?? stepId;
}

export function wordTargetsFor(stepId: string): { readonly min: number; readonly target: number; readonly max: number } {
  return WORD_TARGETS[stepId] ?? { min: 0, target: 0, max: 100_000 };
}

export function helperCopyFor(t: AppMessages, stepId: string): string | undefined {
  const helper: Record<string, string> = t.onboarding.helperCopy;
  return helper[stepId];
}

export function writingStepEyebrow(t: AppMessages, stepId: string): string {
  const index = WRITING_STEP_ORDER.indexOf(stepId as (typeof WRITING_STEP_ORDER)[number]);
  return t.onboarding.sampleCounter(index + 1, WRITING_STEP_ORDER.length);
}

export function buildProgress(t: AppMessages, session: VoiceCalibrationSessionView, displayStepId: string): readonly WizardStepVM[] {
  const serverIndex = STEP_ORDER.indexOf(session.currentStepId as (typeof STEP_ORDER)[number]);
  return STEP_ORDER.map((id, index) => ({
    id,
    label: stepLabel(t, id),
    status: id === displayStepId ? "active" : index < serverIndex ? "done" : "upcoming"
  }));
}

export function buildVoicePreviewVM(profile: VoiceProfileScreenView, t: AppMessages): VoicePreviewVM {
  const confidence = profile.profile.confidence;
  return {
    ringValue: confidenceRingValue(confidence),
    ringCaption: t.common.confidence.caption[confidence],
    headline: t.common.confidence.headline[confidence],
    proseCore: profile.reasoning?.core.narrativeProse ?? "",
    proseDevelopment: profile.reasoning?.development?.developmentProse,
    descriptorChips: profile.profile.styleMarkers.map((marker) => voiceSignalLabel(t, marker))
  };
}

export function isLowConfidence(profile: VoiceProfileScreenView): boolean {
  return profile.profile.confidence === "low";
}

// Points "reescrever esta amostra" at whichever writing step has the fewest words — the
// session doesn't rank samples itself, so word count is the honest proxy available client-side.
export function weakestWritingStep(t: AppMessages, session: VoiceCalibrationSessionView): { readonly stepId: string; readonly label: string } | undefined {
  const candidates = session.steps.filter((step) =>
    (WRITING_STEP_ORDER as readonly string[]).includes(step.stepId)
  );
  if (candidates.length === 0) return undefined;
  const weakest = candidates.reduce((min, step) => ((step.wordCount ?? 0) < (min.wordCount ?? 0) ? step : min));
  return { stepId: weakest.stepId, label: stepLabel(t, weakest.stepId) };
}

export function stepBefore(stepId: string): string | undefined {
  const index = STEP_ORDER.indexOf(stepId as (typeof STEP_ORDER)[number]);
  return index > 0 ? STEP_ORDER[index - 1] : undefined;
}

// Backend confirmed: submitStep/skipStep/completeReview all reject a stepId/call once
// session.currentStepId has moved past it (and completeReview flips status to "completed", after
// which every further mutation is rejected outright) — there's no "reopen an earlier step"
// transition yet (registered as GAP #12 in docs/live/plan/fase-b-gaps.md). "Voltar" and "reescrever
// esta amostra" still navigate the wizard's local display back for review, but the containers treat
// any writing step behind currentStepId as read-only (see isPastStep below) instead of resubmitting
// into that guaranteed 400 — describeCalibrationError below is for genuine failures on the real
// current step.
export function isPastStep(session: VoiceCalibrationSessionView, stepId: string): boolean {
  return stepId !== session.currentStepId;
}

export function describeCalibrationError(t: AppMessages, error: unknown): string {
  if (error && typeof error === "object") {
    const responseMessage = "responseMessage" in error ? (error as { responseMessage?: unknown }).responseMessage : undefined;
    if (typeof responseMessage === "string" && responseMessage) return responseMessage;
    const message = "message" in error ? (error as { message?: unknown }).message : undefined;
    if (typeof message === "string" && message) return message;
  }
  return t.onboarding.errorFallback;
}

// 1e — PostResetReturn (breakdown-15 §1). AccountResetResponse only carries onboardingRequired
// (GAP #7: no resetAt/prior-context fields) — resetDate/topic/audience are captured client-side,
// right before the reset mutation fires, by whoever triggers it (settings.tsx).
export interface PostResetContext {
  readonly resetDate: string;
  readonly topic: string;
  readonly audience: string;
}

const POST_RESET_STORAGE_KEY = "cultiv:post-reset-context";

export function storePostResetContext(context: PostResetContext): void {
  try {
    window.localStorage.setItem(POST_RESET_STORAGE_KEY, JSON.stringify(context));
  } catch {
    // ignore — best-effort persistence
  }
}

export function readPostResetContext(): PostResetContext | undefined {
  try {
    const raw = window.localStorage.getItem(POST_RESET_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PostResetContext) : undefined;
  } catch {
    return undefined;
  }
}

export function clearPostResetContext(): void {
  try {
    window.localStorage.removeItem(POST_RESET_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function daysUntil(iso: string, now: Date): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000));
}

// Same honest-fields approach as generate-view.ts's formatTrialLine — no trial-generation-count
// contract exists (GAP #8), so this reads only what BillingEntitlementView actually carries.
export function formatCalibrationTrialLine(t: AppMessages, entitlement: BillingEntitlementView | undefined, now: Date): string | undefined {
  if (!entitlement || entitlement.status !== "trialing") return undefined;
  const texts = creditsAsTexts(entitlement.availableCredits, entitlement.canonicalCreditCost);
  const days = entitlement.trialEndsAt ? daysUntil(entitlement.trialEndsAt, now) : undefined;
  return [t.onboarding.trialLabel, `~${t.common.texts(texts)}`, days !== undefined ? t.onboarding.trialDaysRemaining(days) : undefined]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

const SESSION_STORAGE_KEY = "cultiv:calibration-session-id";

// No loader/router-level session persistence available (router.tsx is out of scope for this
// slice) — a plain localStorage handle is what lets a reload resume the same in_progress session
// instead of silently starting a fresh one via startSession. Best-effort: private-mode Safari (and
// this repo's jsdom test environment) can throw on access — a resumed session is a nice-to-have,
// never a correctness requirement, so failures fall back to "no stored session" silently.
export function readStoredSessionId(): string | undefined {
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function storeSessionId(sessionId: string): void {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {
    // ignore — best-effort persistence
  }
}

export function clearStoredSessionId(): void {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}
