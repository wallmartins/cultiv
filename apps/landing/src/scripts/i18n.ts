export type Lang = "pt" | "en";

declare global {
  interface Window {
    cultivApplyMeta?: (lang: Lang) => void;
  }
}

const listeners = new Set<(lang: Lang) => void>();

export function getLang(): Lang {
  return document.documentElement.dataset.lang === "en" ? "en" : "pt";
}

export function setLang(l: Lang): void {
  if (getLang() === l) return;
  const d = document.documentElement;
  d.dataset.lang = l;
  d.lang = l === "en" ? "en" : "pt-BR";
  try {
    localStorage.setItem("cultiv-lang", l);
  } catch {
  }
  window.cultivApplyMeta?.(l);
  for (const fn of listeners) fn(l);
}

export function onLangChange(fn: (lang: Lang) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
