import type {
  BillingEntitlementView,
  ExecutionsPageView,
  GenerationChannel,
  GenerationIntent,
  GenerationIntentAmbiguity,
  GenerationPreviewResponse,
  GenerationPrefillQuestion,
  QualityMode
} from "@my-ai-orchestrator/contracts";
import { creditsAsTexts, type WizardAnswer } from "@my-ai-orchestrator/shared";
import type { ThreadMessageData } from "@my-ai-orchestrator/ui/app/generate";

export const CHANNEL_STEP_ID = "channel";

export type GuidedStepKind = "ambiguity" | "question" | "channel";

export interface GuidedStep {
  readonly kind: GuidedStepKind;
  readonly id: string;
  readonly angle?: GenerationPrefillQuestion["angle"];
  readonly prompt: string;
  readonly note?: string;
}

// Mirrors apps/backend/.../catalog/generation-intent-catalog.ts INTENT_CATALOG_COPY pt-BR labels —
// small enough to duplicate locally rather than pull backend code across the boundary.
const INTENT_LABEL: Record<GenerationIntent, string> = {
  "share-idea": "compartilhar uma ideia",
  "explain-deeply": "explicar a fundo",
  "engage-audience": "engajar sua audiência",
  "tell-story": "contar uma história",
  "update-subscribers": "atualizar quem te acompanha",
  "document-decision": "registrar uma decisão"
};

// The backend's own graceful fallback (generation-prefill.ts buildResponse) already absorbs LLM
// failure into a valid 200 response — this is only reached if the /me/generation-prefill call
// itself rejects (network/infra). Mirrors BACKBONE_QUESTION_COPY["pt-BR"] so the session degrades
// to the exact same 4 questions the server would have produced.
export function fallbackQuestionPlan(theme: string): readonly GenerationPrefillQuestion[] {
  return [
    { id: "thesis", angle: "thesis", prompt: `Qual é a tese ou hipótese central que você quer defender sobre "${theme}"?` },
    { id: "experience", angle: "experience", prompt: "Que experiência concreta sua seria o melhor exemplo aqui?" },
    { id: "tension", angle: "tension", prompt: "Existe um contraponto, uma tensão ou uma objeção que vale a pena nomear?" },
    { id: "motivation", angle: "motivation", prompt: "Por que esse tema importa pra você agora?" }
  ];
}

// The ambiguity question (when present) is always first, then the backbone/extra plan, then
// channel — one flat sequence so wizard-session's qIndex can walk it uniformly.
export function buildGuidedSteps(
  questionPlan: readonly GenerationPrefillQuestion[],
  intentAmbiguity: GenerationIntentAmbiguity | null,
  intent: GenerationIntent | undefined
): readonly GuidedStep[] {
  const steps: GuidedStep[] = [];

  if (intentAmbiguity?.ambiguous && intentAmbiguity.alternative && intent) {
    // ponytail: the answer to this step still can't correct `intent` — no contract carries a
    // free-text answer back to a resolution, and ADR 0004 rejects a chip/choice UI here. See
    // docs/live/plan/fase-b-gaps.md GAP #14.
    steps.push({
      kind: "ambiguity",
      id: "ambiguity",
      prompt: `Isso é mais sobre ${INTENT_LABEL[intent]} ou sobre ${INTENT_LABEL[intentAmbiguity.alternative]}?`,
      note: "me diga em uma frase — isso muda o ângulo do texto"
    });
  }

  for (const question of questionPlan) {
    steps.push({ kind: "question", id: question.id, angle: question.angle, prompt: question.prompt });
  }

  steps.push({
    kind: "channel",
    id: CHANNEL_STEP_ID,
    prompt: "Onde você vai publicar?",
    note: "opcional — pular deixa como texto livre"
  });

  return steps;
}

// Only ambiguity/question steps get numbered ("pergunta N de M") — channel has its own prompt.
export function questionStepCount(steps: readonly GuidedStep[]): number {
  return steps.filter((step) => step.kind !== "channel").length;
}

export function questionEyebrow(index: number, total: number): string {
  return `pergunta ${index + 1} de ${total} · pulável`;
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

// ADR 0004 §5: theme -> topic, thesis -> goal, everything else -> keyPoints[]. Skipped/blank
// answers are omitted entirely — never a placeholder — so a lighter briefing degrades gracefully
// into a lighter pipeline rather than faking content.
export function buildBriefing(
  theme: string,
  steps: readonly GuidedStep[],
  answers: readonly WizardAnswer[]
): Record<string, unknown> {
  let goal: string | undefined;
  const keyPoints: string[] = [];

  for (const answer of answers) {
    if (answer.skipped) continue;
    const text = answer.text.trim();
    if (!text) continue;
    const step = steps.find((candidate) => candidate.id === answer.questionId);
    if (!step || step.kind === "channel") continue;
    if (step.kind === "question" && step.angle === "thesis") {
      goal = text;
    } else {
      keyPoints.push(text);
    }
  }

  return {
    topic: theme,
    ...(goal ? { goal } : {}),
    ...(keyPoints.length > 0 ? { keyPoints } : {})
  };
}

export interface PlatformOption {
  readonly id: string;
  readonly label: string;
  readonly channel: GenerationChannel;
}

// Rich platform vocabulary -> the 4 GenerationChannel buckets (ADR 0004 §2). ids match the
// backend's detectPlatformInTheme heuristic (generation-prefill-platform.ts) so detectedPlatform
// preselects the right chip.
export const PLATFORM_OPTIONS: readonly PlatformOption[] = [
  { id: "linkedin", label: "LinkedIn", channel: "professional-network" },
  { id: "x", label: "X", channel: "social" },
  { id: "instagram", label: "Instagram", channel: "social" },
  { id: "medium", label: "Medium", channel: "blog" },
  { id: "substack", label: "Substack", channel: "blog" },
  { id: "blog", label: "Blog próprio", channel: "blog" },
  { id: "newsletter", label: "Newsletter", channel: "email" }
];

const QUALITY_MODE_LABEL: Record<QualityMode, string> = {
  fast: "rápido",
  balanced: "equilibrado",
  strict: "denso"
};

export function formatCostLabel(preview: GenerationPreviewResponse | undefined, fallbackCreditCost: number | undefined): string {
  if (!preview) {
    return fallbackCreditCost !== undefined ? `custo: a partir de ${fallbackCreditCost} créditos` : "custo: calculando…";
  }
  const mode = QUALITY_MODE_LABEL[preview.pricingSnapshot.qualityMode];
  return `custo: ${preview.pricingSnapshot.creditPrice} créditos · saldo depois: ${preview.projectedBalanceAfterGeneration} · modo: ${mode}`;
}

function daysUntil(iso: string, now: Date): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000));
}

// No trial-generation-count contract exists yet (GAP #8 in the breakdown is stale — real fields
// are status/canGenerate/gate/trialEndsAt/canonicalCreditCost) — honest copy uses what the
// entitlement actually carries: the credits-as-texts estimate + days left in the trial window.
export function formatTrialLine(entitlement: BillingEntitlementView | undefined, now: Date): string | undefined {
  if (!entitlement || entitlement.status !== "trialing") return undefined;
  const texts = creditsAsTexts(entitlement.availableCredits, entitlement.canonicalCreditCost);
  const days = entitlement.trialEndsAt ? daysUntil(entitlement.trialEndsAt, now) : undefined;
  return ["período de teste", `~${texts} textos`, days !== undefined ? `${days} dias restantes` : undefined]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

const GATE_MESSAGE: Partial<Record<BillingEntitlementView["gate"], string>> = {
  no_credits: "sem créditos suficientes para gerar",
  trial_expired: "seu teste expirou",
  past_due: "pagamento pendente",
  lapsed: "assinatura inativa"
};

export function generateBlockedReason(entitlement: BillingEntitlementView | undefined): string | undefined {
  if (!entitlement || entitlement.canGenerate) return undefined;
  return GATE_MESSAGE[entitlement.gate] ?? "não é possível gerar agora";
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
export function formatQueueEta(running: number): string {
  return `~${Math.max(1, running * 2)} min`;
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

// Best-effort channel guess from the pasted body itself (same PLATFORM_OPTIONS vocabulary the
// channel step uses) — this is the paste sub-flow's own read, separate from the backend's
// detectPlatformInTheme (that only runs once the theme is submitted).
function guessChannel(pasted: string): string {
  const lower = pasted.toLowerCase();
  const match = PLATFORM_OPTIONS.find((option) => lower.includes(option.id));
  return match?.label ?? "Texto livre";
}

export function parsePastedTheme(pasted: string): PastedThemeParse {
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

  return { title, channel: guessChannel(pasted), angles, linkCount };
}
