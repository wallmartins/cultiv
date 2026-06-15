import type { MarketingLocale } from "~/i18n/marketing/types";
import {
  formatProseDocument,
  resolveDocumentFallbackTitle
} from "../format-prose-document.js";
import { formatThreadForDisplay } from "../format-thread.js";
import type { ShowcaseSample } from "../types.js";
import type { ShowcaseTheme } from "./types.js";

export function toShowcaseSample(theme: ShowcaseTheme, locale: MarketingLocale): ShowcaseSample {
  const content = theme.locales[locale];
  const contentTypeLabel = theme.contentTypeLabel[locale];
  const fallbackTitle = resolveDocumentFallbackTitle(content.briefingInput, contentTypeLabel);
  const isThread = theme.contentTypeId === "twitter-thread";

  if (isThread) {
    return {
      id: theme.id,
      contentTypeLabel,
      index: theme.index,
      briefing: content.briefingSummary,
      genericOutput: content.genericOutput,
      voiceOutput: content.voiceOutput,
      genericPosts: formatThreadForDisplay(content.genericOutput),
      voicePosts: formatThreadForDisplay(content.voiceOutput),
      generation: {
        themeId: theme.id,
        contentTypeId: theme.contentTypeId,
        language: locale === "pt" ? "pt-BR" : "en-US",
        briefingInput: content.briefingInput,
        genericPrompt: content.genericPrompt,
        qualityMode: theme.qualityMode
      }
    };
  }

  return {
    id: theme.id,
    contentTypeLabel,
    index: theme.index,
    briefing: content.briefingSummary,
    genericOutput: content.genericOutput,
    voiceOutput: content.voiceOutput,
    genericDocument: formatProseDocument(content.genericOutput, theme.contentTypeId, fallbackTitle),
    voiceDocument: formatProseDocument(content.voiceOutput, theme.contentTypeId, fallbackTitle),
    generation: {
      themeId: theme.id,
      contentTypeId: theme.contentTypeId,
      language: locale === "pt" ? "pt-BR" : "en-US",
      briefingInput: content.briefingInput,
      genericPrompt: content.genericPrompt,
      qualityMode: theme.qualityMode
    }
  };
}
