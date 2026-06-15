import { readStoredAppLocale } from "./locale-storage";
import type { AppLocale } from "./types";

export function resolveAppLocaleFromBrowser(): AppLocale {
  if (typeof window === "undefined") {
    return "pt";
  }

  return navigator.language.toLowerCase().startsWith("en") ? "en" : "pt";
}

export function resolveAppLocale(): AppLocale {
  return readStoredAppLocale() ?? resolveAppLocaleFromBrowser();
}
