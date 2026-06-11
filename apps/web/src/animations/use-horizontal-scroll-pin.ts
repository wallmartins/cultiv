import { useEffect, useRef } from "react";
import { loadGsapRuntime } from "./gsap-runtime";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export function useHorizontalScrollPin<TSection extends HTMLElement, TTrack extends HTMLElement>() {
  const sectionRef = useRef<TSection | null>(null);
  const trackRef = useRef<TTrack | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || prefersReducedMotion()) {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void loadGsapRuntime().then(({ gsap }) => {
      if (cancelled) {
        return;
      }

      const context = gsap.context(() => {
        const getScrollDistance = () => Math.max(track.scrollWidth - window.innerWidth, 0);

        gsap.to(track, {
          x: () => -getScrollDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getScrollDistance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1
          }
        });
      }, section);

      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return { sectionRef, trackRef };
}
