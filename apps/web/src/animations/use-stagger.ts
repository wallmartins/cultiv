import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { MOTION, registerGsapPlugins } from "./gsap-config";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export function useStaggerReveal<T extends HTMLElement>(selector: string) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container || prefersReducedMotion()) {
      return;
    }

    registerGsapPlugins(ScrollTrigger);

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

    return () => context.revert();
  }, [selector]);

  return ref;
}
