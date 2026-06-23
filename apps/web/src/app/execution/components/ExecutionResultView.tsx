import { LogbookProse } from "@my-ai-orchestrator/ui";
import { lenisScrollRegionClassName, lenisScrollRegionProps } from "~/platform/ui/lenis-scroll-region";

export interface ExecutionResultViewProps {
  readonly content: string;
  /** When true, the parent panel handles scrolling (e.g. active-execution drawer). */
  readonly embedInScrollParent?: boolean;
}

export function ExecutionResultView({ content, embedInScrollParent = false }: ExecutionResultViewProps) {
  return (
    <LogbookProse
      className={
        embedInScrollParent
          ? "whitespace-pre-wrap rounded-[var(--radius-cartography)] px-4 py-5"
          : `max-h-[min(70vh,40rem)] overflow-y-auto whitespace-pre-wrap rounded-[var(--radius-cartography)] px-4 py-5 ${lenisScrollRegionClassName}`
      }
      {...(embedInScrollParent ? {} : lenisScrollRegionProps)}
    >
      {content}
    </LogbookProse>
  );
}
