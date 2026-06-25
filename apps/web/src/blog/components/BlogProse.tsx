import { cn } from "@my-ai-orchestrator/ui";

export interface BlogProseProps {
  readonly html: string;
  readonly className?: string;
}

export function BlogProse({ html, className }: BlogProseProps) {
  return (
    <div
      className={cn(
        "ui-type-conducao text-[1.125rem] leading-[1.75] text-ink",
        "[&_h2]:font-autoridade",
        "[&_a]:text-deep-blue",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-terracotta",
        "[&_code]:font-mono",
        "[&_img]:rounded-[5px]",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
