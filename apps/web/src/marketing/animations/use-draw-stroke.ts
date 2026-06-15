import { useEffect, useRef } from "react";
import { loadGsapRuntime } from "./gsap-runtime";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export function useDrawStroke<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void loadGsapRuntime().then(({ gsap }) => {
      if (cancelled) {
        return;
      }

      const paths = root.querySelectorAll<SVGPathElement>("[data-draw-stroke]");
      const context = gsap.context(() => {
        paths.forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 0.9 });
          gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: root,
              start: "top 75%"
            }
          });
        });
      }, root);

      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return ref;
}
