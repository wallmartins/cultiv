import { useEffect, useRef } from "react";
import { MOTION } from "./gsap-config";
import { loadGsapRuntime } from "./gsap-runtime";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export function useStaggerReveal<T extends HTMLElement>(selector: string) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container || prefersReducedMotion()) {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void loadGsapRuntime().then(({ gsap }) => {
      if (cancelled) {
        return;
      }

      const items = container.querySelectorAll(selector);
      if (items.length === 0) {
        return;
      }

      const context = gsap.context(() => {
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
              trigger: container,
              start: "top 80%"
            }
          }
        );
      }, container);

      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [selector]);

  return ref;
}
