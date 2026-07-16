// Atos 8–9 (CTA final + Footer) — ports the design's `setupCloseReveal`
// (cultiv-hero-v5.dc.html 1044–1067): fades + lifts the CTA-final promise
// and the footer's belief line in as each enters the viewport. JS-off and
// prefers-reduced-motion both leave the content at its natural opacity/
// position from the very first paint (no inline styles ever applied), so
// nothing depends on JS or an observer to be readable — matching the design's
// own guard (`this._RM.matches` checked once, before any style is touched).
//
// Both `CtaFinal.astro` and `Footer.astro` carry a `[data-close-reveal]`
// wrapper and each call `initCloseReveal()` from their own bundled script —
// the module-level guard below makes repeat calls a no-op, so it doesn't
// matter which section's script runs first or whether both do.
import { reducedMotion } from "./engine";

const CLOSE_REVEAL_SELECTOR = "[data-close-reveal]";
// Design 1064: never leave the content stuck invisible if the
// IntersectionObserver never fires (e.g. the element is already fully
// off-screen in a way some engines miscompute, or a headless capture never
// triggers a layout pass).
const FALLBACK_MS = 1800;

let initialized = false;

export function initCloseReveal(): void {
  if (initialized) return;
  initialized = true;

  const nodes = Array.from(document.querySelectorAll<HTMLElement>(CLOSE_REVEAL_SELECTOR));
  if (!nodes.length) return;
  // Reduced motion (or no IntersectionObserver support): leave the resting
  // HTML/CSS opacity as-is — no hide-then-reveal choreography.
  if (reducedMotion() || typeof IntersectionObserver === "undefined") return;

  for (const el of nodes) {
    el.style.opacity = "0";
    el.style.transform = "translateY(18px)";
    el.style.transition =
      "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)";
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
        io.unobserve(el);
      }
    },
    { threshold: 0.25 }
  );
  for (const el of nodes) io.observe(el);

  setTimeout(() => {
    for (const el of nodes) {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }
  }, FALLBACK_MS);
}
