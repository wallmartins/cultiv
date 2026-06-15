import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getAppMessages } from "./get-app-messages";
import { resolveAppLocale } from "./resolve-app-locale";
import { writeStoredAppLocale } from "./locale-storage";
import type { AppLocale, AppMessages } from "./types";

type AppLocaleContextValue = {
  readonly locale: AppLocale;
  readonly messages: AppMessages;
  readonly setLocale: (locale: AppLocale) => void;
};

const AppLocaleContext = createContext<AppLocaleContextValue | null>(null);

export function AppLocaleProvider({ children }: { readonly children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("pt");

  useEffect(() => {
    setLocaleState(resolveAppLocale());
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    writeStoredAppLocale(next);
    setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      messages: getAppMessages(locale),
      setLocale
    }),
    [locale, setLocale]
  );

  return <AppLocaleContext.Provider value={value}>{children}</AppLocaleContext.Provider>;
}

export function useAppLocale(): AppLocaleContextValue {
  const context = useContext(AppLocaleContext);
  if (!context) {
    const locale = resolveAppLocale();
    return {
      locale,
      messages: getAppMessages(locale),
      setLocale: (next) => writeStoredAppLocale(next)
    };
  }

  return context;
}
