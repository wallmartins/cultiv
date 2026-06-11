import { Text } from "../primitives/Text.js";
import { cn } from "../lib/cn.js";

export interface SectionHeaderProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly description?: string;
  readonly className?: string;
  readonly invert?: boolean;
  readonly highlight?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  invert,
  highlight
}: SectionHeaderProps) {
  const titleParts = highlight ? title.split(highlight) : null;

  return (
    <header className={cn("mb-12 max-w-5xl space-y-5 md:mb-16", className)}>
      {eyebrow ? (
        <Text as="p" variant="meta" className={invert ? "text-showcase-muted" : "text-moss"}>
          {eyebrow}
        </Text>
      ) : null}
      <Text
        as="h2"
        variant="chapter"
        className={cn(
          invert ? "text-showcase-foreground" : "text-foreground",
          "max-w-5xl overflow-hidden"
        )}
      >
        {titleParts ? (
          <>
            {titleParts[0]}
            <span className="text-golden">{highlight}</span>
            {titleParts[1]}
          </>
        ) : (
          title
        )}
        <span className={invert ? "text-showcase-muted" : "text-muted"}>.</span>
      </Text>
      {description ? (
        <Text
          as="p"
          variant="body-lg"
          className={invert ? "max-w-2xl text-showcase-muted" : "max-w-2xl text-muted"}
        >
          {description}
        </Text>
      ) : null}
    </header>
  );
}
