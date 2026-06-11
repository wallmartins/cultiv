import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useState, type ReactNode } from "react";
import { LenisContext } from "./lenis-context";
import { registerGsapPlugins } from "./gsap-config";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export interface LenisProviderProps {
  readonly children: ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    registerGsapPlugins(ScrollTrigger);

    const instance = new Lenis({
      duration: 1.2,
      smoothWheel: true
    });

    setLenis(instance);

    instance.on("scroll", ScrollTrigger.update);

    const ticker = (time: number) => {
      instance.raf(time * 1000);
    };

    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (typeof value === "number") {
          instance.scrollTo(value, { immediate: true });
        }

        return instance.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight
        };
      }
    });

    ScrollTrigger.refresh();
    void document.fonts?.ready.then(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      gsap.ticker.remove(ticker);
      instance.destroy();
      setLenis(null);
      ScrollTrigger.scrollerProxy(document.body, {});
      ScrollTrigger.killAll();
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
