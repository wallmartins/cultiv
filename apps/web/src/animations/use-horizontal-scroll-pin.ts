import { useEffect, useRef } from "react";
import { loadGsapRuntime } from "./gsap-runtime";
import { prefersReducedMotion } from "./prefers-reduced-motion";

const PIN_SELECTOR = ".solution-breath-scrolly__pin";
const BRAND_SELECTOR = ".solution-breath-scrolly__brand";
const DESKTOP_PIN_BUFFER_RATIO = 0.28;

function getDesktopPinBuffer() {
  return Math.max(window.innerHeight * DESKTOP_PIN_BUFFER_RATIO, 180);
}

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
    let cleanupGsap: (() => void) | undefined;
    let cleanupLayout: (() => void) | undefined;

    const getPin = () => section.querySelector<HTMLElement>(PIN_SELECTOR) ?? section;

    void loadGsapRuntime().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) {
        return;
      }

      let scrollDistance = 0;

      const measureScrollDistance = () => {
        const pin = getPin();
        const brand = track.querySelector<HTMLElement>(BRAND_SELECTOR);
        if (!brand) {
          scrollDistance = 0;
          return scrollDistance;
        }

        const previousX = gsap.getProperty(track, "x") as number;
        gsap.set(track, { x: 0 });

        const brandRight = brand.getBoundingClientRect().right;
        const pinLeft = pin.getBoundingClientRect().left;
        scrollDistance = Math.max(brandRight - pinLeft, 0);

        gsap.set(track, { x: previousX });

        return scrollDistance;
      };

      const resolvePinSpan = () => {
        measureScrollDistance();
        return scrollDistance + getDesktopPinBuffer();
      };

      const syncSectionHeight = () => {
        section.style.height = `${resolvePinSpan()}px`;
      };

      const refreshLayout = () => {
        measureScrollDistance();
        syncSectionHeight();
        ScrollTrigger.refresh();
      };

      const context = gsap.context(() => {
        refreshLayout();

        gsap.to(track, {
          x: () => -scrollDistance,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${resolvePinSpan()}`,
            pin: true,
            pinSpacing: false,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1
          }
        });
      }, section);

      cleanupGsap = () => context.revert();

      const brand = track.querySelector(BRAND_SELECTOR);
      const observer = new ResizeObserver(refreshLayout);
      observer.observe(track);
      observer.observe(getPin());
      if (brand) {
        observer.observe(brand);
      }
      window.addEventListener("resize", refreshLayout);

      cleanupLayout = () => {
        observer.disconnect();
        window.removeEventListener("resize", refreshLayout);
      };
    });

    return () => {
      cancelled = true;
      cleanupGsap?.();
      cleanupLayout?.();
      section.style.removeProperty("height");
    };
  }, []);

  return { sectionRef, trackRef };
}
