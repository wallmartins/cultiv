import { useEffect, useRef } from "react";
import { cn } from "@my-ai-orchestrator/ui";
import { MOTION } from "~/animations/gsap-config";
import { loadGsapRuntime } from "~/animations/gsap-runtime";
import { prefersReducedMotion } from "~/animations/prefers-reduced-motion";

export interface LetterRevealProps {
  readonly text: string;
  readonly className?: string;
  readonly as?: "h1" | "h2" | "p";
}

export function LetterReveal({ text, className, as: Tag = "h1" }: LetterRevealProps) {
  const containerRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion()) {
      return;
    }

    let cancelled = false;

    void loadGsapRuntime().then(({ gsap }) => {
      if (cancelled) {
        return;
      }

      const letters = container.querySelectorAll("[data-letter]");
      gsap.fromTo(
        letters,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: MOTION.reveal.duration * 0.55,
          ease: MOTION.reveal.ease,
          stagger: 0.045,
          delay: 0.15
        }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (prefersReducedMotion()) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag ref={containerRef} className={cn("block", className)} aria-label={text}>
      {text.split("").map((char, index) => (
        <span
          key={`${char}-${index}`}
          data-letter
          className={cn("inline-block", char === " " && "w-[0.28em]")}
          aria-hidden={char !== " "}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </Tag>
  );
}
