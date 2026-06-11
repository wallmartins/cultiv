import type { MarketingContentTypeId } from "../../content-types/catalog.js";
import type { MarketingLocale } from "~/i18n/types";

export const SHOWCASE_THEME_IDS = ["blog-post", "linkedin-post", "thread"] as const;

export type ShowcaseThemeId = (typeof SHOWCASE_THEME_IDS)[number];

export type ShowcaseBriefingInput = Readonly<
  Record<string, string | readonly string[]>
>;

export type ShowcaseThemeLocaleContent = {
  readonly briefingSummary: string;
  readonly briefingInput: ShowcaseBriefingInput;
  readonly genericPrompt: string;
  readonly genericOutput: string;
  readonly voiceOutput: string;
};

export type ShowcaseTheme = {
  readonly id: ShowcaseThemeId;
  readonly contentTypeId: MarketingContentTypeId;
  readonly index: string;
  readonly contentTypeLabel: Readonly<Record<MarketingLocale, string>>;
  readonly qualityMode: "fast" | "balanced" | "strict";
  readonly locales: Readonly<Record<MarketingLocale, ShowcaseThemeLocaleContent>>;
};
