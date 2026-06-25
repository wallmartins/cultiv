import { cn } from "@my-ai-orchestrator/ui";

export interface BlogProseProps {
  readonly html: string;
  readonly className?: string;
}

export function BlogProse({ html, className }: BlogProseProps) {
  return (
    <div
      className={cn(
        "ui-type-autoridade text-[1.1875rem] font-normal leading-[1.8] tracking-[0.01em] text-ink",
        "[&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-[1.625rem] [&_h2]:font-semibold [&_h2]:leading-[1.25] [&_h2]:text-deep-blue",
        "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-[1.375rem] [&_h3]:font-semibold [&_h3]:leading-[1.3] [&_h3]:text-deep-blue",
        "[&_p+p]:mt-[1.8em] [&_p:first-child]:mt-0",
        "[&_a]:text-deep-blue [&_a]:underline [&_a]:decoration-terracotta/40 [&_a]:underline-offset-[0.2em] hover:[&_a]:decoration-terracotta",
        "[&_blockquote]:my-8 [&_blockquote]:border-l-2 [&_blockquote]:border-terracotta [&_blockquote]:pl-5 [&_blockquote]:text-ink-muted",
        "[&_code]:font-mono [&_code]:text-[0.9em]",
        "[&_img]:my-8 [&_img]:rounded-[5px]",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
