import { useEffect, useState } from "react";
import { useLenisInstance } from "./lenis-context";

const SCROLL_THRESHOLD_PX = 4;

export function useHeaderScrolled(threshold = SCROLL_THRESHOLD_PX): boolean {
  const lenis = useLenisInstance();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      const scrollY = lenis?.scroll ?? window.scrollY;
      setScrolled(scrollY > threshold);
    };

    update();

    if (lenis) {
      lenis.on("scroll", update);
      return () => lenis.off("scroll", update);
    }

    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [lenis, threshold]);

  return scrolled;
}
