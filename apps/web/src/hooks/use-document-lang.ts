import { useEffect } from "react";
import type { AppLocale } from "~/i18n/app/types";
import type { MarketingLocale } from "~/i18n/marketing/types";

type DocumentLangLocale = AppLocale | MarketingLocale;

function toDocumentLang(locale: DocumentLangLocale): string {
  return locale === "pt" ? "pt-BR" : "en";
}

export function useDocumentLang(locale: DocumentLangLocale) {
  useEffect(() => {
    document.documentElement.lang = toDocumentLang(locale);
  }, [locale]);
}
