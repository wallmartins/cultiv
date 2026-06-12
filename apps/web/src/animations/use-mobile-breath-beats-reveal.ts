import { useEffect, type RefObject } from "react";
import { MOTION } from "./gsap-config";
import { loadGsapRuntime } from "./gsap-runtime";
import { prefersReducedMotion } from "./prefers-reduced-motion";

const MOBILE_QUERY = "(max-width: 767px)";
const BEAT_SELECTOR = "[data-breath-beat]";

export function useMobileBreathBeatsReveal(sectionRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion() || !window.matchMedia(MOBILE_QUERY).matches) {
      return;
    }

    const beats = section.querySelectorAll<HTMLElement>(BEAT_SELECTOR);
    if (beats.length === 0) {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void loadGsapRuntime().then(({ gsap }) => {
      if (cancelled) {
        return;
      }

      const context = gsap.context(() => {
        for (const beat of beats) {
          gsap.fromTo(
            beat,
            { autoAlpha: 0, y: MOTION.reveal.y * 0.55 },
            {
              autoAlpha: 1,
              y: 0,
              duration: MOTION.reveal.duration,
              ease: MOTION.reveal.ease,
              scrollTrigger: {
                trigger: beat,
                start: "top 86%",
                toggleActions: "play none none reverse"
              }
            }
          );
        }
      }, section);

      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [sectionRef]);
}
