// Runtime pt⇄en toggle for the v5 landing. `LandingLayout`'s inline
// bootstrap script already seeds `html[data-lang]` before paint
// (localStorage → `navigator.language` fallback) and defines
// `window.cultivApplyMeta`, so crawlers and JS-off readers get the right
// language with zero flash of the wrong copy. This module only drives the
// RUNTIME toggle (the nav's pt·en pill) after hydration, reusing that same
// `cultivApplyMeta` for the `<title>`/description swap instead of
// redefining it.

export type Lang = "pt" | "en";

declare global {
  interface Window {
    cultivApplyMeta?: (lang: Lang) => void;
  }
}

const listeners = new Set<(lang: Lang) => void>();

/** Current language, read from `html[data-lang]` (pt is the default/absent
    state — matches the layout bootstrap and every CSS lang-switch rule). */
export function getLang(): Lang {
  return document.documentElement.dataset.lang === "en" ? "en" : "pt";
}

/** Switches the page language: flips `html[data-lang]`/`html.lang`,
    persists the choice, swaps `<title>`/description via the layout's
    `cultivApplyMeta`, and notifies subscribers. No-ops if already on `l`. */
export function setLang(l: Lang): void {
  if (getLang() === l) return;
  const d = document.documentElement;
  d.dataset.lang = l;
  d.lang = l === "en" ? "en" : "pt-BR";
  try {
    localStorage.setItem("cultiv-lang", l);
  } catch {
    /* Private mode / storage quota — the toggle still works for this pageview. */
  }
  window.cultivApplyMeta?.(l);
  for (const fn of listeners) fn(l);
}

/** Subscribe to language changes (fired only on actual toggles, not on
    initial load — read `getLang()` yourself for the first render).
    Returns an unregister function. */
export function onLangChange(fn: (lang: Lang) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
