import { LogbookProse, Text } from "@my-ai-orchestrator/ui";
import { lenisScrollRegionClassName, lenisScrollRegionProps } from "~/platform/ui/lenis-scroll-region";
import { splitExecutionContentParagraphs } from "~/app/execution/lib/split-execution-paragraphs";

export interface ExecutionResultViewProps {
  readonly content: string;
  /** When true, the parent panel handles scrolling (e.g. active-execution drawer). */
  readonly embedInScrollParent?: boolean;
}

export function ExecutionResultView({ content, embedInScrollParent = false }: ExecutionResultViewProps) {
  const paragraphs = splitExecutionContentParagraphs(content);

  return (
    <LogbookProse
      className={
        embedInScrollParent
          ? "border-0 bg-transparent rounded-[var(--radius-cartography)] px-4 py-5"
          : `border-0 bg-transparent max-h-[min(70vh,40rem)] overflow-y-auto rounded-[var(--radius-cartography)] px-4 py-5 ${lenisScrollRegionClassName}`
      }
      {...(embedInScrollParent ? {} : lenisScrollRegionProps)}
    >
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <Text
            key={`${index}-${paragraph.slice(0, 24)}`}
            as="p"
            variant="logbook"
            className="whitespace-pre-line"
          >
            {paragraph}
          </Text>
        ))}
      </div>
    </LogbookProse>
  );
}
