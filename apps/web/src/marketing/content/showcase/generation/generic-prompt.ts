import type { MarketingLocale } from "~/i18n/marketing/types";
import { getShowcaseTheme } from "../themes/index.js";
import type { ShowcaseThemeId } from "../themes/types.js";

export function getShowcaseGenericPrompt(
  themeId: ShowcaseThemeId,
  locale: MarketingLocale
): string {
  return getShowcaseTheme(themeId).locales[locale].genericPrompt;
}
