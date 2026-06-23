import { useEffect, useRef } from "react";
import { loadGsapRuntime } from "./gsap-runtime";
import { prefersReducedMotion } from "./prefers-reduced-motion";

const STAMP = {
  duration: 0.45,
  ease: "power3.out"
} as const;

export function useStampReveal<T extends HTMLElement>() {
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
          { scale: 0.92, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: STAMP.duration,
            ease: STAMP.ease
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
