import { useEffect, useRef } from "react";
import { MOTION } from "./gsap-config";
import { loadGsapRuntime } from "./gsap-runtime";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export interface SectionRevealOptions {
  readonly start?: string;
}

export function useSectionReveal<T extends HTMLElement = HTMLDivElement>(
  selector = "[data-section-item]",
  options?: SectionRevealOptions
) {
  const ref = useRef<T | null>(null);
  const revealStart = options?.start ?? "top 72%";

  useEffect(() => {
    const section = ref.current;
    if (!section || prefersReducedMotion()) {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void loadGsapRuntime().then(({ gsap }) => {
      if (cancelled) {
        return;
      }

      const items = section.querySelectorAll(selector);
      const context = gsap.context(() => {
        if (items.length > 0) {
          gsap.fromTo(
            items,
            { autoAlpha: 0, y: MOTION.reveal.y },
            {
              autoAlpha: 1,
              y: 0,
              duration: MOTION.reveal.duration,
              ease: MOTION.reveal.ease,
              stagger: MOTION.stagger,
              scrollTrigger: {
                trigger: section,
                start: revealStart
              }
            }
          );
          return;
        }

        gsap.fromTo(
          section,
          { autoAlpha: 0, y: MOTION.reveal.y },
          {
            autoAlpha: 1,
            y: 0,
            duration: MOTION.reveal.duration,
            ease: MOTION.reveal.ease,
            scrollTrigger: {
              trigger: section,
              start: revealStart
            }
          }
        );
      }, section);

      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [selector, revealStart]);

  return ref;
}
