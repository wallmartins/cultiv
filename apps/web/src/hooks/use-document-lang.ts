import { useEffect } from "react";
import type { MarketingLocale } from "~/i18n/marketing/types";

function toDocumentLang(locale: MarketingLocale): string {
  return locale === "pt" ? "pt-BR" : "en";
}

export function useDocumentLang(locale: MarketingLocale) {
  useEffect(() => {
    document.documentElement.lang = toDocumentLang(locale);
  }, [locale]);
}
