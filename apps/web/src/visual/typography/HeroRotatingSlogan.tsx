import { useRotatingTypewriter } from "~/animations/use-rotating-typewriter";
import type { HeroSlogan } from "~/i18n/types";

export interface HeroRotatingSloganProps {
  readonly slogan: HeroSlogan;
  readonly className?: string;
}

export function HeroRotatingSlogan({ slogan, className }: HeroRotatingSloganProps) {
  const { displayed, showCaret } = useRotatingTypewriter(slogan.keywords);

  return (
    <span className={className}>
      {slogan.prefix}
      <span className="inline whitespace-nowrap" aria-live="polite">
        {displayed}
        {showCaret ? (
          <span aria-hidden className="ml-px motion-reduce:hidden animate-pulse">
            |
          </span>
        ) : null}
      </span>
      {slogan.suffix}
    </span>
  );
}
