import type { LocaleMessages } from "~/i18n/types";

export interface SolutionBreathBeatsProps {
  readonly brand: string;
  readonly copy: LocaleMessages["solutionBreath"];
}

export function SolutionBreathBeats({ brand, copy }: SolutionBreathBeatsProps) {
  return (
    <div className="solution-breath-beats">
      <header className="solution-breath-beats__intro" data-breath-beat>
        <div className="solution-breath-beats__intro-inner">
          <p
            className="solution-breath-beats__note font-handwritten text-showcase-accent"
            style={{ letterSpacing: "var(--tracking-handwritten)" }}
          >
            <span className="solution-breath-scrolly__quote-mark" aria-hidden="true">
              &ldquo;
            </span>
            {copy.handwrittenNote}
            <span className="solution-breath-scrolly__quote-mark" aria-hidden="true">
              &rdquo;
            </span>
            <span className="solution-breath-scrolly__cite-sep" aria-hidden="true">
              {" "}
              &mdash;
            </span>
          </p>
          <p
            className="solution-breath-beats__brand font-handwritten text-showcase-foreground"
            style={{ letterSpacing: "var(--tracking-handwritten)" }}
          >
            {brand}
          </p>
        </div>
      </header>

      {copy.keywords.map((keyword, index) => (
        <article
          key={keyword.phrase}
          className="solution-breath-beats__moment"
          data-breath-beat
        >
          <p className="solution-breath-beats__index">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3
            className="solution-breath-beats__phrase font-handwritten"
            style={{ letterSpacing: "var(--tracking-handwritten)" }}
          >
            {keyword.phrase}
          </h3>
          <p className="solution-breath-beats__detail">{keyword.microcopy}</p>
        </article>
      ))}
    </div>
  );
}
