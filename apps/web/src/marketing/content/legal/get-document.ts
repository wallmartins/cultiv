import { privacyEn } from "./en/privacy.js";
import { termsEn } from "./en/terms.js";
import { privacyPt } from "./pt/privacy.js";
import { termsPt } from "./pt/terms.js";
import type { LegalDocument } from "./types.js";
import type { MarketingLocale } from "~/i18n/marketing/types";

type LegalKind = "privacy" | "terms";

const documents: Record<MarketingLocale, Record<LegalKind, LegalDocument>> = {
  pt: { privacy: privacyPt, terms: termsPt },
  en: { privacy: privacyEn, terms: termsEn }
};

export function getLegalDocument(locale: MarketingLocale, kind: LegalKind): LegalDocument {
  return documents[locale][kind];
}
