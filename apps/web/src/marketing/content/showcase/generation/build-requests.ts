import type { MarketingLocale } from "~/i18n/marketing/types";
import type { MarketingContentTypeId } from "../../content-types/catalog.js";
import { getShowcaseTheme } from "../themes/index.js";
import type { ShowcaseBriefingInput, ShowcaseThemeId } from "../themes/types.js";

export type ShowcaseQualityMode = "fast" | "balanced" | "strict";

export type ShowcaseMeExecutionRequest = {
  readonly contentType: MarketingContentTypeId;
  readonly briefing: ShowcaseBriefingInput;
  readonly language: string;
  readonly qualityMode?: ShowcaseQualityMode;
  readonly quoteId?: string;
  readonly includeTrace?: boolean;
};

export type ShowcaseApiRunRequest = {
  readonly pipelineType: MarketingContentTypeId;
  readonly briefing: ShowcaseBriefingInput;
  readonly language: string;
  readonly qualityMode: ShowcaseQualityMode;
};

export type BuildShowcaseRequestOptions = {
  readonly qualityMode?: ShowcaseQualityMode;
  readonly quoteId?: string;
  readonly includeTrace?: boolean;
};

export function resolveShowcaseLanguage(locale: MarketingLocale): "pt-BR" | "en-US" {
  return locale === "pt" ? "pt-BR" : "en-US";
}

export function buildShowcaseMeExecutionRequest(
  themeId: ShowcaseThemeId,
  locale: MarketingLocale,
  options: BuildShowcaseRequestOptions = {}
): ShowcaseMeExecutionRequest {
  const theme = getShowcaseTheme(themeId);
  const content = theme.locales[locale];

  return {
    contentType: theme.contentTypeId,
    briefing: { ...content.briefingInput },
    language: resolveShowcaseLanguage(locale),
    qualityMode: options.qualityMode ?? theme.qualityMode,
    ...(options.quoteId ? { quoteId: options.quoteId } : {}),
    ...(options.includeTrace ? { includeTrace: options.includeTrace } : {})
  };
}

export function buildShowcaseApiRunRequest(
  themeId: ShowcaseThemeId,
  locale: MarketingLocale,
  options: BuildShowcaseRequestOptions = {}
): ShowcaseApiRunRequest {
  const theme = getShowcaseTheme(themeId);
  const content = theme.locales[locale];

  return {
    pipelineType: theme.contentTypeId,
    briefing: { ...content.briefingInput },
    language: resolveShowcaseLanguage(locale),
    qualityMode: options.qualityMode ?? theme.qualityMode
  };
}

export function buildShowcaseGenerationPreviewRequest(
  themeId: ShowcaseThemeId,
  locale: MarketingLocale,
  options: BuildShowcaseRequestOptions = {}
) {
  const execution = buildShowcaseMeExecutionRequest(themeId, locale, options);

  return {
    contentType: execution.contentType,
    qualityMode: execution.qualityMode ?? "balanced"
  };
}
