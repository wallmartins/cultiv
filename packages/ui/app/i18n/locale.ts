// Structurally identical to shared's `UiLanguage`, deliberately re-declared: packages/ui is a
// zero-workspace-dep leaf (ADR 0003 / monorepo-governance), so it cannot import that type. The
// provider takes the locale as a prop, which typechecks across the boundary either way.
export type AppLocale = "pt-BR" | "en";

export const APP_LOCALES: readonly AppLocale[] = ["pt-BR", "en"];

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "pt-BR" || value === "en";
}

export const DEFAULT_LOCALE: AppLocale = "pt-BR";
