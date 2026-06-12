import { useEffect, useState } from "react";
import type { LocaleMessages } from "~/i18n/types";
import { useHorizontalScrollPin } from "~/animations/use-horizontal-scroll-pin";
import { prefersReducedMotion } from "~/animations/prefers-reduced-motion";
import { SolutionBreathChip } from "~/components/SolutionBreathChip";

export interface SolutionBreathScrollyProps {
  readonly brand: string;
  readonly copy: LocaleMessages["solutionBreath"];
}

const chipAnchors = [
  "solution-breath-scrolly__chip--a",
  "solution-breath-scrolly__chip--b",
  "solution-breath-scrolly__chip--c",
  "solution-breath-scrolly__chip--d"
] as const;

function SolutionBreathScrollyTrack({ brand, copy }: SolutionBreathScrollyProps) {
  const { sectionRef, trackRef } = useHorizontalScrollPin<HTMLDivElement, HTMLDivElement>();

  return (
    <div ref={sectionRef} className="solution-breath-scrolly" data-section-item>
      <div className="solution-breath-scrolly__pin">
        <div ref={trackRef} className="solution-breath-scrolly__track">
          <div className="solution-breath-scrolly__stage">
            <div className="solution-breath-scrolly__headline">
              <p
                className="solution-breath-scrolly__note font-handwritten text-showcase-accent"
                style={{ letterSpacing: "var(--tracking-handwritten)" }}
              >
                {copy.handwrittenNote}
              </p>
              <p className="solution-breath-scrolly__brand font-handwritten text-showcase-foreground">
                {brand}
              </p>
            </div>

            {copy.keywords.map((keyword, index) => (
              <SolutionBreathChip
                key={keyword.phrase}
                phrase={keyword.phrase}
                microcopy={keyword.microcopy}
                className={chipAnchors[index]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SolutionBreathScrolly({ brand, copy }: SolutionBreathScrollyProps) {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  if (reducedMotion) {
    return (
      <div className="solution-breath-static" data-section-item>
        <div className="solution-breath-static__headline">
          <p
            className="font-handwritten text-[clamp(2rem,5vw,4rem)] leading-none text-showcase-accent"
            style={{ letterSpacing: "var(--tracking-handwritten)" }}
          >
            {copy.handwrittenNote}
          </p>
          <p
            className="font-handwritten text-[clamp(3.5rem,14vw,7.5rem)] leading-none text-showcase-foreground"
            style={{ letterSpacing: "var(--tracking-handwritten)" }}
          >
            {brand}
          </p>
        </div>
        <div className="solution-breath-static__chips">
          {copy.keywords.map((keyword) => (
            <SolutionBreathChip
              key={keyword.phrase}
              phrase={keyword.phrase}
              microcopy={keyword.microcopy}
            />
          ))}
        </div>
      </div>
    );
  }

  return <SolutionBreathScrollyTrack brand={brand} copy={copy} />;
}
