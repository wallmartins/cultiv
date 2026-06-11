import { useEffect, useRef } from "react";
import { MOTION } from "./gsap-config";
import { loadGsapRuntime } from "./gsap-runtime";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void loadGsapRuntime().then(({ gsap }) => {
      if (cancelled) {
        return;
      }

      const context = gsap.context(() => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: MOTION.reveal.y },
          {
            autoAlpha: 1,
            y: 0,
            duration: MOTION.reveal.duration,
            ease: MOTION.reveal.ease,
            scrollTrigger: {
              trigger: element,
              start: "top 85%"
            }
          }
        );
      }, element);

      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return ref;
}
