import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { MOTION, registerGsapPlugins } from "./gsap-config";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) {
      return;
    }

    registerGsapPlugins(ScrollTrigger);

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

    return () => context.revert();
  }, []);

  return ref;
}
