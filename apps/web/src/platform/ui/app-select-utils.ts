import type { AppLocale } from "~/i18n/app/types";
import type { AppSelectOption } from "./AppSelect";

function selectCollator(locale: AppLocale): Intl.Collator {
  return new Intl.Collator(locale === "pt" ? "pt-BR" : "en", { sensitivity: "base" });
}

export function sortAppSelectOptions(
  locale: AppLocale,
  options: readonly AppSelectOption[]
): AppSelectOption[] {
  return [...options].sort((left, right) => selectCollator(locale).compare(left.label, right.label));
}
