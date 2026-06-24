import { useEffect, useRef } from "react";
import { MOTION } from "./gsap-config";
import { loadGsapRuntime } from "./gsap-runtime";
import { prefersReducedMotion } from "./prefers-reduced-motion";

const WORD_SELECTOR = "[data-hero-word]";

export function useHeroHeadlineWords<T extends HTMLElement = HTMLHeadingElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const heading = ref.current;
    if (!heading) {
      return;
    }

    const words = heading.querySelectorAll(WORD_SELECTOR);
    if (words.length === 0) {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void loadGsapRuntime().then(({ gsap }) => {
      if (cancelled) {
        return;
      }

      const context = gsap.context(() => {
        if (prefersReducedMotion()) {
          gsap.set(words, { autoAlpha: 1 });
          return;
        }

        gsap.fromTo(
          words,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: MOTION.reveal.duration,
            ease: MOTION.reveal.ease,
            stagger: MOTION.heroWord.stagger
          }
        );
      }, heading);

      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return ref;
}
