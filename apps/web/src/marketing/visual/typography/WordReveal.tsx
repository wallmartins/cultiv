import { useEffect, useRef } from "react";
import { cn } from "@my-ai-orchestrator/ui";
import { MOTION } from "~/marketing/animations/gsap-config";
import { loadGsapRuntime } from "~/marketing/animations/gsap-runtime";
import { prefersReducedMotion } from "~/marketing/animations/prefers-reduced-motion";

export interface WordRevealProps {
  readonly text: string;
  readonly className?: string;
  readonly as?: "h1" | "h2" | "p";
}

export function WordReveal({ text, className, as: Tag = "h1" }: WordRevealProps) {
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

      const words = container.querySelectorAll("[data-word]");
      gsap.fromTo(
        words,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: MOTION.reveal.duration * 0.6,
          ease: MOTION.reveal.ease,
          stagger: 0.08,
          delay: 0.12
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

  const words = text.split(/\s+/).filter(Boolean);

  return (
    <Tag ref={containerRef} className={cn("block", className)} aria-label={text}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="inline-block">
          <span data-word className="inline-block" aria-hidden>
            {word}
          </span>
          {index < words.length - 1 ? <span className="inline-block w-[0.3em]" aria-hidden /> : null}
        </span>
      ))}
    </Tag>
  );
}
