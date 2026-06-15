import type { AppLocale } from "./types";

export const APP_LOCALE_STORAGE_KEY = "cultiv.app.locale";

export function readStoredAppLocale(): AppLocale | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY);
  if (stored === "pt" || stored === "en") {
    return stored;
  }

  return null;
}

export function writeStoredAppLocale(locale: AppLocale): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
}
