import type { MarketingLocale } from "../../../i18n/marketing/types.js";

export function llmsPath(locale: MarketingLocale, full: boolean): string {
  const file = full ? "llms-full.txt" : "llms.txt";
  return locale === "pt" ? `/${file}` : `/en/${file}`;
}
