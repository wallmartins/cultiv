import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UiLanguage = "pt-BR" | "en";

interface UiLanguageState {
  readonly language: UiLanguage;
  readonly setLanguage: (language: UiLanguage) => void;
}

// Written by apps/landing (src/scripts/i18n.ts) as a bare "pt" | "en". Honouring it means a
// language chosen on the marketing site carries into the app instead of resetting.
const LANDING_LOCALE_KEY = "cultiv-lang";

export function languageFromNavigator(language: string | undefined): UiLanguage {
  return language?.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
}

// Only the FIRST visit reaches this: persist() rehydrates a stored choice over it. Order is
// landing's choice → browser language → pt-BR.
export function resolveInitialUiLanguage(): UiLanguage {
  if (typeof window === "undefined") return "pt-BR";
  try {
    const fromLanding = window.localStorage.getItem(LANDING_LOCALE_KEY);
    if (fromLanding === "en") return "en";
    if (fromLanding === "pt") return "pt-BR";
    return languageFromNavigator(window.navigator.language);
  } catch {
    // Safari private mode throws on localStorage access.
    return "pt-BR";
  }
}

// Owned by /app/settings (gap #10a) — client-side only, no backend contract. Read by the i18n
// provider in apps/web, which pushes it into packages/ui's I18nProvider.
export const useUiLanguage = create<UiLanguageState>()(
  persist(
    (set) => ({
      language: resolveInitialUiLanguage(),
      setLanguage: (language) => set({ language })
    }),
    { name: "cultiv-ui-language" }
  )
);
