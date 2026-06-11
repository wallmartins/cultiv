import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { registerGsapPlugins } from "./gsap-config";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export function useBotanicalUpright<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) {
      return;
    }

    registerGsapPlugins(ScrollTrigger);

    const leaves = root.querySelectorAll<SVGElement>("[data-botanical-upright]");
    const context = gsap.context(() => {
      leaves.forEach((leaf) => {
        gsap.fromTo(
          leaf,
          { rotate: -18, scaleY: 0.72, transformOrigin: "center bottom" },
          {
            rotate: 0,
            scaleY: 1,
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: root,
              start: "top 70%"
            }
          }
        );
      });
    }, root);

    return () => context.revert();
  }, []);

  return ref;
}
