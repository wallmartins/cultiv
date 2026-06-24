import type { ExecutionStatusView } from "@my-ai-orchestrator/contracts";
import { getContentTypeLabel } from "~/i18n/app/content-types";
import {
  getChannelLabel,
  getIntentLabel,
  getLengthTierLabel
} from "~/i18n/app/generation-intents";
import type { AppLocale } from "~/i18n/app/types";

export function getExecutionTitle(
  item: Pick<ExecutionStatusView, "briefingTopic" | "generationIntent" | "contentType">,
  locale: AppLocale
): string {
  if (item.briefingTopic) {
    return item.briefingTopic;
  }

  if (item.generationIntent) {
    return getIntentLabel(locale, item.generationIntent, item.generationIntent);
  }

  return getContentTypeLabel(locale, item.contentType, item.contentType);
}

export function getExecutionFormatLabel(
  item: Pick<ExecutionStatusView, "lengthTier" | "channel">,
  locale: AppLocale
): string | null {
  const parts: string[] = [];

  if (item.lengthTier) {
    parts.push(getLengthTierLabel(locale, item.lengthTier, item.lengthTier));
  }

  if (item.channel && item.channel !== "unspecified") {
    parts.push(getChannelLabel(locale, item.channel, item.channel));
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function getExecutionSubtitle(
  item: Pick<
    ExecutionStatusView,
    "briefingTopic" | "generationIntent" | "lengthTier" | "channel"
  >,
  locale: AppLocale
): string | null {
  const parts: string[] = [];

  if (item.briefingTopic && item.generationIntent) {
    parts.push(getIntentLabel(locale, item.generationIntent, item.generationIntent));
  }

  const formatLabel = getExecutionFormatLabel(item, locale);
  if (formatLabel) {
    parts.push(formatLabel);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}
