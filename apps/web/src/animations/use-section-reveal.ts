import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { MOTION, registerGsapPlugins } from "./gsap-config";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export function useSectionReveal<T extends HTMLDivElement = HTMLDivElement>(
  selector = "[data-section-item]"
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const section = ref.current;
    if (!section || prefersReducedMotion()) {
      return;
    }

    registerGsapPlugins(ScrollTrigger);

    const items = section.querySelectorAll(selector);
    const context = gsap.context(() => {
      if (items.length > 0) {
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
              trigger: section,
              start: "top 72%"
            }
          }
        );
        return;
      }

      gsap.fromTo(
        section,
        { autoAlpha: 0, y: MOTION.reveal.y },
        {
          autoAlpha: 1,
          y: 0,
          duration: MOTION.reveal.duration,
          ease: MOTION.reveal.ease,
          scrollTrigger: {
            trigger: section,
            start: "top 72%"
          }
        }
      );
    }, section);

    return () => context.revert();
  }, [selector]);

  return ref;
}
