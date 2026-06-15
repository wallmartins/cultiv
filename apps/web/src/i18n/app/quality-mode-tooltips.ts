import type { QualityMode } from "@my-ai-orchestrator/contracts";
import type { BillingPlanTier } from "@my-ai-orchestrator/payments";
import { resolveMinimumPlanTierForQualityMode } from "@my-ai-orchestrator/payments";
import type { AppLocale, AppMessages } from "./types";

export type QualityModeHelpContext = {
  readonly allowed: boolean;
  readonly blockedReason?: string;
};

export type QualityModeHelpDetail = {
  readonly modeLabel: string;
  readonly description: string;
  readonly footnote?: string;
};

export function getPlanTierLabel(
  locale: AppLocale,
  tier: BillingPlanTier,
  messages: AppMessages
): string {
  return messages.qualityModes.plans[tier];
}

export function getQualityModeHelpDetail(
  locale: AppLocale,
  mode: QualityMode,
  messages: AppMessages,
  context: QualityModeHelpContext
): QualityModeHelpDetail {
  const modeLabel = messages.qualityModes[mode];
  const description = messages.qualityModes.descriptions[mode];
  let footnote: string | undefined;

  if (!context.allowed) {
    if (context.blockedReason === "insufficient_credits") {
      footnote = messages.qualityModes.insufficientCredits;
    } else {
      const minimumTier = resolveMinimumPlanTierForQualityMode(mode);
      const planLabel = getPlanTierLabel(locale, minimumTier, messages);
      footnote = messages.qualityModes.unlockPlan.replace("{plan}", planLabel);
    }
  }

  return { modeLabel, description, footnote };
}

export function getQualityModeHelpScreenReaderText(
  locale: AppLocale,
  mode: QualityMode,
  messages: AppMessages,
  context: QualityModeHelpContext
): string {
  const { modeLabel, description, footnote } = getQualityModeHelpDetail(locale, mode, messages, context);

  return [messages.qualityModes.helper, `${modeLabel}: ${description}`, footnote]
    .filter((part): part is string => Boolean(part))
    .join("\n\n");
}

export function getQualityModeTooltip(
  locale: AppLocale,
  mode: QualityMode,
  messages: AppMessages,
  context: QualityModeHelpContext
): string {
  const { description, footnote } = getQualityModeHelpDetail(locale, mode, messages, context);

  if (footnote) {
    return `${description}\n\n${footnote}`;
  }

  return description;
}
