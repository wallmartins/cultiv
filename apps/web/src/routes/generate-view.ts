import type {
  BillingEntitlementView,
  ExecutionsPageView,
  GenerationChannel,
  GenerationPreviewResponse,
  GenerationPrefillQuestion
} from "@my-ai-orchestrator/contracts";
import { creditsAsTexts, type WizardAnswer } from "@my-ai-orchestrator/shared";
import type { AppMessages } from "@my-ai-orchestrator/ui/app/i18n";
import type { ThreadMessageData } from "@my-ai-orchestrator/ui/app/generate";

export const CHANNEL_STEP_ID = "channel";

export type GuidedStepKind = "question" | "channel";

export interface GuidedStep {
  readonly kind: GuidedStepKind;
  readonly id: string;
  readonly angle?: GenerationPrefillQuestion["angle"];
  readonly prompt: string;
  readonly note?: string;
}

// The backend's own graceful fallback (generation-prefill.ts buildResponse) already absorbs LLM
// failure into a valid 200 response — this is only reached if the /me/generation-prefill call
// itself rejects (network/infra). Mirrors the backend's generic backbone (backboneGenerationSlots,
// pt-BR) so the session degrades to the exact same 4 questions the server would have produced.
export function fallbackQuestionPlan(t: AppMessages, theme: string): readonly GenerationPrefillQuestion[] {
  return [
    { id: "thesis", angle: "thesis", prompt: t.generate.fallbackQuestion.thesis(theme) },
    { id: "experience", angle: "experience", prompt: t.generate.fallbackQuestion.experience },
    { id: "tension", angle: "tension", prompt: t.generate.fallbackQuestion.tension },
    { id: "motivation", angle: "motivation", prompt: t.generate.fallbackQuestion.motivation }
  ];
}

// The backbone/extra question plan, then channel — one flat sequence so wizard-session's qIndex
// can walk it uniformly.
export function buildGuidedSteps(t: AppMessages, questionPlan: readonly GenerationPrefillQuestion[]): readonly GuidedStep[] {
  const steps: GuidedStep[] = [];

  for (const question of questionPlan) {
    steps.push({ kind: "question", id: question.id, angle: question.angle, prompt: question.prompt });
  }

  steps.push({
    kind: "channel",
    id: CHANNEL_STEP_ID,
    prompt: t.generate.channelPrompt,
    note: t.generate.channelNote
  });

  return steps;
}

// Only question steps get numbered ("pergunta N de M") — channel has its own prompt.
export function questionStepCount(steps: readonly GuidedStep[]): number {
  return steps.filter((step) => step.kind !== "channel").length;
}

export function questionEyebrow(t: AppMessages, index: number, total: number): string {
  return t.generate.questionEyebrow(index + 1, total);
}

export function buildThreadMessages(
  theme: string,
  steps: readonly GuidedStep[],
  answers: readonly WizardAnswer[]
): readonly ThreadMessageData[] {
  const messages: ThreadMessageData[] = [{ kind: "user", id: "theme", text: theme }];

  for (const answer of answers) {
    const step = steps.find((candidate) => candidate.id === answer.questionId);
    if (!step) continue;
    messages.push({ kind: "system", id: `${step.id}-q`, prompt: step.prompt, note: step.note });
    if (!answer.skipped) {
      messages.push({ kind: "user", id: `${step.id}-a`, text: answer.text });
    }
  }

  return messages;
}

// ADR 0010 §6: theme -> topic, backbone angle -> labeled slot (thesis -> payload, experience ->
// anchor, tension -> resistance, motivation -> stake). `audience` is the F4-2 narrowing result
// (one declared audience, the common denominator of all of them, or an ephemeral one) — passes
// through only when the caller has one. Skipped/blank answers are omitted entirely — never a
// placeholder — so a lighter briefing degrades gracefully into a lighter pipeline rather than
// faking content.
export function buildBriefing(
  theme: string,
  steps: readonly GuidedStep[],
  answers: readonly WizardAnswer[],
  audience?: string
): Record<string, unknown> {
  let payload: string | undefined;
  let anchor: string | undefined;
  let resistance: string | undefined;
  let stake: string | undefined;

  const foldIntoPayload = (text: string) => {
    payload = payload ? `${payload} ${text}` : text;
  };

  for (const answer of answers) {
    if (answer.skipped) continue;
    const text = answer.text.trim();
    if (!text) continue;
    const step = steps.find((candidate) => candidate.id === answer.questionId);
    if (!step || step.kind === "channel") continue;

    switch (step.angle) {
      case "thesis":
        foldIntoPayload(text);
        break;
      case "experience":
        anchor = text;
        break;
      case "tension":
        resistance = text;
        break;
      case "motivation":
        stake = text;
        break;
      case "extra":
        // "extra" follow-ups have no slot of their own (backbone-curado.md defines exactly
        // payload/anchor/resistance/stake, not a 5th), so they fold into the payload. F4-3 keeps the
        // four backbone angles — the G4 slots map 1:1 onto them — so this is the settled shape.
        foldIntoPayload(text);
        break;
    }
  }

  return {
    topic: theme,
    ...(audience ? { audience } : {}),
    ...(payload ? { payload } : {}),
    ...(anchor ? { anchor } : {}),
    ...(resistance ? { resistance } : {}),
    ...(stake ? { stake } : {})
  };
}

// F4-2 (ADR 0010 §6) — the two buffers around audience narrowing: 0 or 1 declared audiences means
// there's nothing to narrow between (auto-skip, straight to prefill); 2+ means the chip step
// renders and the author either picks one or declines (common denominator, see below).
export type NarrowingBuffer =
  | { readonly kind: "skip"; readonly audience?: string }
  | { readonly kind: "narrow"; readonly audiences: readonly string[] };

export function resolveNarrowingBuffer(declaredAudiences: readonly string[]): NarrowingBuffer {
  if (declaredAudiences.length <= 1) return { kind: "skip", audience: declaredAudiences[0] };
  return { kind: "narrow", audiences: declaredAudiences };
}

// Declining to narrow folds every declared audience into one descriptor — still a single
// `briefing.audience` string, just an un-narrowed one.
export function commonDenominatorAudience(declaredAudiences: readonly string[]): string {
  return declaredAudiences.join(", ");
}

// Declared chips + this generation's ephemeral additions ("+ adicionar público"), deduped in
// display order. Ephemeral audiences never reach the Practice Profile — they only ever flow
// through the `audience` field of this one prefill/briefing.
export function mergeAudienceOptions(
  declaredAudiences: readonly string[],
  ephemeralAudiences: readonly string[]
): readonly string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const audience of [...declaredAudiences, ...ephemeralAudiences]) {
    if (seen.has(audience)) continue;
    seen.add(audience);
    merged.push(audience);
  }
  return merged;
}

export interface PlatformOption {
  readonly id: string;
  readonly label: string;
  readonly channel: GenerationChannel;
}

// F4-6 — the channel step picks by functional bucket, not platform brand (web-only vocabulary
// change; the 4 GenerationChannel values themselves are unchanged). id === channel, so
// selectPlatform's id -> channel lookup keeps working unmodified.
export function platformOptions(t: AppMessages): readonly PlatformOption[] {
  return [
    { id: "professional-network", label: t.generate.channelBucketLabel.professionalNetwork, channel: "professional-network" },
    { id: "social", label: t.generate.channelBucketLabel.social, channel: "social" },
    { id: "blog", label: t.generate.channelBucketLabel.blog, channel: "blog" },
    { id: "email", label: t.generate.channelBucketLabel.email, channel: "email" }
  ];
}

// The backend's detectPlatformInTheme heuristic (generation-prefill-platform.ts) still returns a
// raw platform name (e.g. "linkedin") — this maps it onto the bucket the chip UI now offers, so
// detectedPlatform keeps preselecting the right chip after F4-6.
const PLATFORM_TO_CHANNEL: Record<string, GenerationChannel> = {
  linkedin: "professional-network",
  x: "social",
  instagram: "social",
  medium: "blog",
  substack: "blog",
  blog: "blog",
  newsletter: "email"
};

export function detectedPlatformChannel(detectedPlatform: string | undefined): GenerationChannel | undefined {
  return detectedPlatform ? PLATFORM_TO_CHANNEL[detectedPlatform] : undefined;
}

export function formatCostLabel(
  t: AppMessages,
  preview: GenerationPreviewResponse | undefined,
  fallbackCreditCost: number | undefined
): string {
  if (!preview) {
    return fallbackCreditCost !== undefined ? t.generate.costFrom(t.common.credits(fallbackCreditCost)) : t.generate.costCalculating;
  }
  const mode = t.generate.qualityModeLabel[preview.pricingSnapshot.qualityMode];
  return t.generate.costFull(t.common.credits(preview.pricingSnapshot.creditPrice), preview.projectedBalanceAfterGeneration, mode);
}

function daysUntil(iso: string, now: Date): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000));
}

// No trial-generation-count contract exists yet (GAP #8 in the breakdown is stale — real fields
// are status/canGenerate/gate/trialEndsAt/canonicalCreditCost) — honest copy uses what the
// entitlement actually carries: the credits-as-texts estimate + days left in the trial window.
export function formatTrialLine(t: AppMessages, entitlement: BillingEntitlementView | undefined, now: Date): string | undefined {
  if (!entitlement || entitlement.status !== "trialing") return undefined;
  const texts = creditsAsTexts(entitlement.availableCredits, entitlement.canonicalCreditCost);
  const days = entitlement.trialEndsAt ? daysUntil(entitlement.trialEndsAt, now) : undefined;
  return [
    t.generate.trialLabel,
    t.generate.trialTextsEstimate(t.common.texts(texts)),
    days !== undefined ? t.generate.trialDaysRemaining(days) : undefined
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

export function generateBlockedReason(t: AppMessages, entitlement: BillingEntitlementView | undefined): string | undefined {
  if (!entitlement || entitlement.canGenerate) return undefined;
  const gateMessage: Partial<Record<BillingEntitlementView["gate"], string>> = t.generate.gateMessage;
  return gateMessage[entitlement.gate] ?? t.generate.gateFallback;
}

// 2b (breakdown-15 §1) — "última do trial" reads the same real quota fields formatTrialLine
// already uses (GAP #8: no dedicated trial-generation-count contract).
export function isLastTrialGeneration(entitlement: BillingEntitlementView | undefined): boolean {
  return Boolean(entitlement && entitlement.status === "trialing" && entitlement.quotaRemaining <= 1);
}

export function countRunning(page: ExecutionsPageView | undefined): number {
  return (page?.items ?? []).filter((item) => item.status === "queued" || item.status === "running").length;
}

// No queue-ETA contract exists — a coarse, clearly-approximate estimate (same honest-fields
// approach as formatTrialLine) rather than fabricated precision.
export function formatQueueEta(t: AppMessages, running: number): string {
  return t.generate.queueEta(Math.max(1, running * 2));
}

// 2g (breakdown-15 §1) — client-side heuristic: enough markdown signal to be worth the
// "entendi assim, confirma?" detour, without a real parser (headings/bullets/bold/links).
const MARKDOWN_SIGNS = /(^#{1,6}\s)|(\*\*[^*]+\*\*)|(^[-*]\s)|(\[[^\]]+\]\([^)]+\))/m;

export function looksLikeMarkdown(pasted: string): boolean {
  return MARKDOWN_SIGNS.test(pasted);
}

function stripMarkdown(line: string): string {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^[-*]\s*/, "")
    .trim();
}

export interface PastedThemeParse {
  readonly title: string;
  readonly channel: string;
  readonly angles: readonly string[];
  readonly linkCount: number;
}

const LINK_PATTERN = /\[[^\]]+\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;

// Best-effort channel guess from the pasted body itself — this is the paste sub-flow's own read,
// separate from the backend's detectPlatformInTheme (that only runs once the theme is submitted).
// Scans for raw platform names (same table detectedPlatformChannel maps), then reports the
// functional bucket label the channel step actually offers post-F4-6.
function guessChannel(t: AppMessages, pasted: string): string {
  const lower = pasted.toLowerCase();
  const platform = Object.keys(PLATFORM_TO_CHANNEL).find((candidate) => lower.includes(candidate));
  const bucket = platform ? PLATFORM_TO_CHANNEL[platform] : undefined;
  const match = platformOptions(t).find((option) => option.channel === bucket);
  return match?.label ?? t.common.freeText;
}

export function parsePastedTheme(t: AppMessages, pasted: string): PastedThemeParse {
  const lines = pasted
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const heading = lines.find((line) => /^#{1,6}\s/.test(line));
  const title = stripMarkdown(heading ?? lines[0] ?? pasted.trim()).slice(0, 140);

  const angles = lines
    .filter((line) => line !== heading && /^([-*]\s|#{1,6}\s)/.test(line))
    .map(stripMarkdown)
    .filter(Boolean)
    .slice(0, 3);

  const linkCount = (pasted.match(LINK_PATTERN) ?? []).length;

  return { title, channel: guessChannel(t, pasted), angles, linkCount };
}
