import { useEffect, useRef } from "react";
import { loadGsapRuntime } from "./gsap-runtime";
import { prefersReducedMotion } from "./prefers-reduced-motion";

const SCRUB_DURATIONS_VH = [120, 70, 70, 70] as const;

export function useDifferentiatorChapters<TSection extends HTMLElement>(enabled: boolean) {
  const sectionRef = useRef<TSection | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stack = stackRef.current;
    if (!section || !stack || !enabled || prefersReducedMotion()) {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void loadGsapRuntime().then(({ gsap }) => {
      if (cancelled) {
        return;
      }

      const chapters = gsap.utils.toArray<HTMLElement>("[data-chapter]", stack);
      if (chapters.length === 0) {
        return;
      }

      const context = gsap.context(() => {
        const totalVh = SCRUB_DURATIONS_VH.reduce((sum, value) => sum + value, 0);

        gsap.set(chapters, { autoAlpha: 0, scale: 0.94 });
        gsap.set(chapters[0], { autoAlpha: 1, scale: 1 });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${totalVh}%`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            anticipatePin: 1
          }
        });

        let elapsed = 0;
        for (let index = 0; index < chapters.length - 1; index += 1) {
          const duration = SCRUB_DURATIONS_VH[index] / totalVh;
          const current = chapters[index];
          const next = chapters[index + 1];
          const position = elapsed;

          timeline.to(current, { autoAlpha: 0, scale: 0.96, duration: duration * 0.35 }, position);
          timeline.fromTo(
            next,
            { autoAlpha: 0, scale: index === 0 ? 0.92 : 0.96 },
            { autoAlpha: 1, scale: 1, duration: duration * 0.65 },
            position + duration * 0.2
          );

          elapsed += duration;
        }
      }, section);

      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [enabled]);

  return { sectionRef, stackRef };
}
