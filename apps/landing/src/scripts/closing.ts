import { reducedMotion } from "./engine";

const CLOSE_REVEAL_SELECTOR = "[data-close-reveal]";
const FALLBACK_MS = 1800;

let initialized = false;

export function initCloseReveal(): void {
  if (initialized) return;
  initialized = true;

  const nodes = Array.from(document.querySelectorAll<HTMLElement>(CLOSE_REVEAL_SELECTOR));
  if (!nodes.length) return;
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
