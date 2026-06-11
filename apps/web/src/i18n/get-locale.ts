import { en } from "./locales/en.js";
import { pt } from "./locales/pt.js";
import type { LocaleMessages, MarketingLocale } from "./types.js";

const catalogs: Record<MarketingLocale, LocaleMessages> = {
  pt,
  en
};

export function getLocaleMessages(locale: MarketingLocale): LocaleMessages {
  return catalogs[locale];
}

export function getAlternateLocale(locale: MarketingLocale): MarketingLocale {
  return locale === "pt" ? "en" : "pt";
}

export function getHomePath(locale: MarketingLocale): string {
  return locale === "en" ? "/en" : "/";
}

export function getPrivacyPath(locale: MarketingLocale): "/privacy" | "/en/privacy" {
  return locale === "en" ? "/en/privacy" : "/privacy";
}

export function getTermsPath(locale: MarketingLocale): "/terms" | "/en/terms" {
  return locale === "en" ? "/en/terms" : "/terms";
}
