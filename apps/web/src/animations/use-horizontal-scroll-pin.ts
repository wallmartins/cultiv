import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { registerGsapPlugins } from "./gsap-config";
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

    registerGsapPlugins(ScrollTrigger);

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

    return () => context.revert();
  }, []);

  return { sectionRef, trackRef };
}
