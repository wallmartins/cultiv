import type { AppLocale } from "./types";

const languageLabels: Record<AppLocale, Record<string, string>> = {
  pt: {
    "pt-BR": "Português (Brasil)",
    "en-US": "Inglês (EUA)",
    en: "Inglês"
  },
  en: {
    "pt-BR": "Portuguese (Brazil)",
    "en-US": "English (US)",
    en: "English"
  }
};

export function getGenerationLanguageLabel(locale: AppLocale, languageCode: string): string {
  return languageLabels[locale][languageCode] ?? languageCode;
}
