import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { cn } from "@my-ai-orchestrator/ui";
import { registerGsapPlugins } from "~/animations/gsap-config";
import { prefersReducedMotion } from "~/animations/prefers-reduced-motion";
import { useBotanicalUpright } from "~/animations/use-botanical-upright";
import { useDrawStroke } from "~/animations/use-draw-stroke";
import {
  BotanicalVine,
  TYPOGRAPHIC_VINE_ANCHORS,
  TYPOGRAPHIC_VINE_VIEWBOX
} from "~/visual/illustrations/BotanicalVine";
import { IllustrationFrame } from "~/visual/IllustrationFrame";

export interface TypeVineProps {
  readonly words: ReadonlyArray<string>;
  readonly className?: string;
}

export function TypeVine({ words, className }: TypeVineProps) {
  const drawRef = useDrawStroke<HTMLDivElement>();
  const uprightRef = useBotanicalUpright<HTMLDivElement>();
  const wordsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = wordsRef.current;
    if (!root || prefersReducedMotion()) {
      return;
    }

    registerGsapPlugins(ScrollTrigger);

    const items = root.querySelectorAll("[data-vine-word]");
    const context = gsap.context(() => {
      items.forEach((item, index) => {
        const anchor = TYPOGRAPHIC_VINE_ANCHORS[index];
        if (!anchor) {
          return;
        }

        gsap.fromTo(
          item,
          { scale: 0, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 1,
            duration: 0.6,
            ease: "back.out(1.5)",
            delay: 0.35 + index * 0.14,
            transformOrigin: `${(anchor.x / TYPOGRAPHIC_VINE_VIEWBOX.width) * 100}% 100%`,
            scrollTrigger: {
              trigger: root,
              start: "top 82%"
            }
          }
        );
      });
    }, root);

    return () => context.revert();
  }, [words]);

  const { width, height } = TYPOGRAPHIC_VINE_VIEWBOX;

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className="relative w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <IllustrationFrame
          ref={(node) => {
            drawRef.current = node;
            uprightRef.current = node;
          }}
          grain={false}
          className="absolute inset-0 text-moss opacity-[0.42]"
        >
          <BotanicalVine variant="typographic" className="h-full w-full" />
        </IllustrationFrame>

        <div
          ref={wordsRef}
          className="pointer-events-none absolute inset-0"
          aria-hidden
        >
          {words.slice(0, TYPOGRAPHIC_VINE_ANCHORS.length).map((word, index) => {
            const anchor = TYPOGRAPHIC_VINE_ANCHORS[index];
            if (!anchor) {
              return null;
            }

            const left = `${(anchor.x / width) * 100}%`;
            const top = `${(anchor.y / height) * 100}%`;

            return (
              <span
                key={`${word}-${index}`}
                data-vine-word
                className={cn(
                  "absolute inline-block whitespace-nowrap",
                  anchor.variant === "display"
                    ? "font-display text-[clamp(1.35rem,3.2vw,2.15rem)] italic leading-none text-foreground"
                    : "font-handwritten text-[clamp(1.15rem,2.8vw,1.85rem)] leading-none text-golden"
                )}
                style={{
                  left,
                  top,
                  transform: "translate(-8%, -108%)"
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
