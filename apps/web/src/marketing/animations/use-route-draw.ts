import { useEffect, useRef } from "react";
import { MOTION } from "./gsap-config";
import { loadGsapRuntime } from "./gsap-runtime";
import { prefersReducedMotion } from "./prefers-reduced-motion";

const PATH_LENGTH = 100;

export interface RouteDrawOptions {
  readonly selector?: string;
  readonly start?: string;
  readonly immediate?: boolean;
}

export function useRouteDraw<T extends HTMLElement = HTMLDivElement>(
  options?: RouteDrawOptions
) {
  const ref = useRef<T | null>(null);
  const selector = options?.selector ?? "[data-route-draw] path";
  const start = options?.start ?? "top 72%";
  const immediate = options?.immediate ?? false;

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

      const paths = section.querySelectorAll<SVGPathElement>(selector);
      if (paths.length === 0) {
        return;
      }

      const context = gsap.context(() => {
        paths.forEach((path) => {
          const targetOffset = Number.parseFloat(
            path.getAttribute("stroke-dashoffset") ?? "0"
          );

          gsap.set(path, { strokeDashoffset: PATH_LENGTH });

          const animation = {
            strokeDashoffset: targetOffset,
            duration: MOTION.routeDraw.duration,
            ease: MOTION.routeDraw.ease
          };

          if (immediate) {
            gsap.to(path, animation);
            return;
          }

          gsap.to(path, {
            ...animation,
            scrollTrigger: {
              trigger: section,
              start
            }
          });
        });
      }, section);

      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [selector, start, immediate]);

  return ref;
}
