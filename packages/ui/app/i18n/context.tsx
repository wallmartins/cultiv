import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { messagesFor, type AppMessages } from "./messages/index.js";
import { makeFormatters, type AppFormatters } from "./formatters.js";
import { DEFAULT_LOCALE, type AppLocale } from "./locale.js";

interface I18nValue {
  readonly locale: AppLocale;
  readonly t: AppMessages;
  readonly format: AppFormatters;
}

const I18nContext = createContext<I18nValue | undefined>(undefined);

export interface I18nProviderProps {
  readonly locale: AppLocale;
  readonly children: ReactNode;
}

// The locale is owned by apps/web (useUiLanguage, persisted) and pushed down — this package stays
// dependency-free and never writes the preference itself.
export function I18nProvider({ locale, children }: I18nProviderProps) {
  const value = useMemo<I18nValue>(
    () => {
      const t = messagesFor(locale);
      return { locale, t, format: makeFormatters(locale, t.common.justNow) };
    },
    [locale]
  );

  // Screen readers pick pronunciation from this; the landing sets it the same way.
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Falls back to the default locale instead of throwing: a component rendered outside the provider
// (a test, an error boundary above it) should still show real copy, not crash. Resolution from
// storage/navigator belongs to whoever owns the preference (shared's useUiLanguage), not here.
function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (context) return context;
  const t = messagesFor(DEFAULT_LOCALE);
  return { locale: DEFAULT_LOCALE, t, format: makeFormatters(DEFAULT_LOCALE, t.common.justNow) };
}

export function useMessages(): AppMessages {
  return useI18n().t;
}

export function useFormat(): AppFormatters {
  return useI18n().format;
}

export function useLocale(): AppLocale {
  return useI18n().locale;
}
