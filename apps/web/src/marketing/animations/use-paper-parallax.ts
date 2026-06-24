import { useEffect } from "react";
import { loadGsapRuntime } from "./gsap-runtime";
import { prefersReducedMotion } from "./prefers-reduced-motion";

const PARALLAX_SELECTOR = "[data-paper-parallax]";
const PARALLAX = {
  x: "2%",
  y: "3%"
} as const;

export function usePaperParallax() {
  useEffect(() => {
    const surface = document.querySelector<HTMLElement>(PARALLAX_SELECTOR);
    if (!surface || prefersReducedMotion()) {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void loadGsapRuntime().then(({ gsap }) => {
      if (cancelled) {
        return;
      }

      const context = gsap.context(() => {
        gsap.set(surface, {
          "--cartography-grain-x": "0%",
          "--cartography-grain-y": "0%"
        });

        gsap.to(surface, {
          "--cartography-grain-x": PARALLAX.x,
          "--cartography-grain-y": PARALLAX.y,
          ease: "none",
          scrollTrigger: {
            trigger: surface,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.4
          }
        });
      }, surface);

      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}
