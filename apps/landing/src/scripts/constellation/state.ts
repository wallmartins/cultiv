// Estado compartilhado da interação (seleção/hover/overlay) e leituras de
// ambiente (breakpoints, toque, reduced motion). Mutável de propósito: os
// módulos escrevem aqui e a UI deriva tudo de applyActive/show/hide.

export type OverlayId = "demo" | "planos";

export interface AppState {
  hoverId: string | null;
  selId: string | null;
  overlay: OverlayId | null;
  readonly reduced: boolean;
}

export function createState(app: HTMLElement): AppState {
  return {
    hoverId: null,
    selId: app.dataset.initial || null,
    overlay: (app.dataset.initialOverlay as OverlayId) || null,
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

/** Mesmos cortes do CSS (constellation.css). */
export const isMobile = () => innerWidth < 640;
export const isStacked = () => innerWidth < 900;
export const isTouch = () => matchMedia("(pointer: coarse)").matches;
