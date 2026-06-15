import { Text } from "@my-ai-orchestrator/ui";

export interface ShowcaseProseOutputProps {
  readonly text: string;
  readonly muted?: boolean;
  readonly truncate?: boolean;
}

export function ShowcaseProseOutput({
  text,
  muted = false,
  truncate = true
}: ShowcaseProseOutputProps) {
  return (
    <Text
      as="p"
      variant="body-lg"
      className={`${truncate ? "line-clamp-10 overflow-hidden text-ellipsis md:line-clamp-12" : ""} ${
        muted ? "text-showcase-muted" : "text-showcase-foreground"
      }`}
    >
      {text}
    </Text>
  );
}
